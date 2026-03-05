import { types, Instance } from 'mobx-state-tree'

export const TodoModel = types
  .model('Todo', {
    id: types.identifier,
    title: types.string,
    description: types.optional(types.string, ''),
    completed: types.optional(types.boolean, false),
    priority: types.optional(
      types.enumeration('Priority', ['low', 'medium', 'high']),
      'medium'
    ),
    category: types.optional(types.string, ''),
    createdAt: types.optional(types.Date, () => new Date()),
    dueDate: types.maybeNull(types.Date),
    tags: types.optional(types.array(types.string), []),
  })
  .actions((self) => ({
    toggle() {
      self.completed = !self.completed
    },
    updateTitle(newTitle: string) {
      self.title = newTitle
    },
    updateDescription(newDescription: string) {
      self.description = newDescription
    },
    setPriority(priority: 'low' | 'medium' | 'high') {
      self.priority = priority
    },
    setCategory(category: string) {
      self.category = category
    },
    setDueDate(date: Date | null) {
      self.dueDate = date
    },
    addTag(tag: string) {
      if (!self.tags.includes(tag)) {
        self.tags.push(tag)
      }
    },
    removeTag(tag: string) {
      const index = self.tags.indexOf(tag)
      if (index > -1) {
        self.tags.splice(index, 1)
      }
    },
  }))
  .views((self) => ({
    get isOverdue() {
      if (!self.dueDate || self.completed) return false
      return new Date() > self.dueDate
    },
    get isDueToday() {
      if (!self.dueDate) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(self.dueDate)
      due.setHours(0, 0, 0, 0)
      return today.getTime() === due.getTime()
    },
  }))

export type TodoType = Instance<typeof TodoModel>

