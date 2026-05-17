import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: '常見問答', plural: '常見問答' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', 'category', 'order'] },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'question', type: 'text', required: true, label: '問題' },
    { name: 'answer', type: 'textarea', required: true, label: '回答' },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: '分類',
      options: [
        { label: '服務流程', value: '服務流程' },
        { label: '價格費用', value: '價格費用' },
        { label: '時程安排', value: '時程安排' },
        { label: '合作方式', value: '合作方式' },
        { label: '其他', value: '其他' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 100, label: '排序' },
  ],
}
