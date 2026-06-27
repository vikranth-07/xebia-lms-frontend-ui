import { STORAGE_KEY } from "../app/constants.js";
import { seedState } from "../utils/data.js";
import { createId } from "../utils/id.utils.js";
import { createAuditEntry, prependAuditEntry } from "../services/audit.service.js";
import { usePersistentState } from "./usePersistentState.js";

function getRecordLabel(record) {
  return record.title || record.name || record.text || record.type;
}

export function useLmsStore(showToast) {
  const [store, setStore] = usePersistentState(STORAGE_KEY, seedState);

  function addAudit(label, target) {
    const entry = createAuditEntry(label, target);
    setStore((currentStore) => ({
      ...currentStore,
      audit: prependAuditEntry(currentStore.audit, entry)
    }));
  }

  function upsertEntity(entity, record, label) {
    const id = record.id || createId(entity.slice(0, 3));
    const finalRecord = { ...record, id };

    setStore((currentStore) => {
      const exists = currentStore[entity].some((item) => item.id === id);
      const nextItems = exists
        ? currentStore[entity].map((item) => (item.id === id ? finalRecord : item))
        : [finalRecord, ...currentStore[entity]];
      return { ...currentStore, [entity]: nextItems };
    });

    addAudit(label, getRecordLabel(record));
    showToast(label);
    return id;
  }

  function handleDeleteCategory(id) {
    const category = store.categories.find((item) => item.id === id);
    if (!window.confirm(`Delete category "${category?.name || "this category"}"? Courses will keep their data but lose this category.`)) return false;

    setStore((currentStore) => ({
      ...currentStore,
      categories: currentStore.categories.filter((item) => item.id !== id),
      courses: currentStore.courses.map((course) =>
        course.categoryId === id ? { ...course, categoryId: "" } : course
      )
    }));
    addAudit("Category deleted", category?.name || "Category");
    showToast("Category deleted");
    return true;
  }

  function handleDeleteCourse(id) {
    const course = store.courses.find((item) => item.id === id);
    if (!window.confirm(`Delete course "${course?.title || "this course"}" and its curriculum?`)) return false;

    const moduleIds = store.modules.filter((item) => item.courseId === id).map((item) => item.id);
    const submoduleIds = store.submodules
      .filter((item) => moduleIds.includes(item.moduleId))
      .map((item) => item.id);

    setStore((currentStore) => ({
      ...currentStore,
      courses: currentStore.courses.filter((item) => item.id !== id),
      modules: currentStore.modules.filter((item) => item.courseId !== id),
      submodules: currentStore.submodules.filter((item) => !moduleIds.includes(item.moduleId)),
      contentBlocks: currentStore.contentBlocks.filter(
        (item) => !submoduleIds.includes(item.submoduleId)
      )
    }));
    addAudit("Course deleted", course?.title || "Course");
    showToast("Course deleted");
    return true;
  }

  function handleDeleteModule(id) {
    const moduleRecord = store.modules.find((item) => item.id === id);
    if (!window.confirm(`Delete module "${moduleRecord?.title || "this module"}" and its submodules?`)) return false;

    const submoduleIds = store.submodules
      .filter((item) => item.moduleId === id)
      .map((item) => item.id);

    setStore((currentStore) => ({
      ...currentStore,
      modules: currentStore.modules.filter((item) => item.id !== id),
      submodules: currentStore.submodules.filter((item) => item.moduleId !== id),
      contentBlocks: currentStore.contentBlocks.filter(
        (item) => !submoduleIds.includes(item.submoduleId)
      )
    }));
    addAudit("Module deleted", moduleRecord?.title || "Module");
    showToast("Module deleted");
    return true;
  }

  function handleDeleteSubmodule(id) {
    const submodule = store.submodules.find((item) => item.id === id);
    if (!window.confirm(`Delete submodule "${submodule?.title || "this submodule"}" and its content blocks?`)) return false;

    setStore((currentStore) => ({
      ...currentStore,
      submodules: currentStore.submodules.filter((item) => item.id !== id),
      contentBlocks: currentStore.contentBlocks.filter((item) => item.submoduleId !== id)
    }));
    addAudit("Submodule deleted", submodule?.title || "Submodule");
    showToast("Submodule deleted");
    return true;
  }

  function handleDeleteContentBlock(id) {
    const block = store.contentBlocks.find((item) => item.id === id);
    if (!window.confirm(`Delete ${block?.type || "content"} block?`)) return false;

    setStore((currentStore) => ({
      ...currentStore,
      contentBlocks: currentStore.contentBlocks.filter((item) => item.id !== id)
    }));
    addAudit("Content block deleted", block?.title || block?.type || "Content");
    showToast("Content block deleted");
    return true;
  }

  function handleToggleEntity(entity, id, field) {
    setStore((currentStore) => ({
      ...currentStore,
      [entity]: currentStore[entity].map((item) =>
        item.id === id ? { ...item, [field]: !item[field] } : item
      )
    }));
    showToast("Status updated");
  }

  function handleResetStore() {
    if (!window.confirm("Reset the prototype data to the original seed?")) return false;
    setStore(seedState);
    showToast("Prototype data reset");
    return true;
  }

  return {
    store,
    upsertEntity,
    handleDeleteCategory,
    handleDeleteCourse,
    handleDeleteModule,
    handleDeleteSubmodule,
    handleDeleteContentBlock,
    handleToggleEntity,
    handleResetStore
  };
}