export interface LessonAttachment {
  label: string
  url: string
}

interface LessonRef {
  id: string
  title: string
}

interface ModuleRef<T extends LessonRef> {
  lessons: T[]
}

export function getAdjacentLessons<T extends LessonRef>(
  modules: ModuleRef<T>[],
  currentLessonId: string
): { prev?: T; next?: T } {
  const flat = modules.flatMap(m => m.lessons)
  const index = flat.findIndex(l => l.id === currentLessonId)
  if (index === -1) return {}

  return { prev: flat[index - 1], next: flat[index + 1] }
}
