import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: '客戶見證', plural: '客戶見證' },
  admin: { useAsTitle: 'author', defaultColumns: ['author', 'company', 'rating', 'order'] },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'text', type: 'textarea', required: true, label: '見證內容' },
    { name: 'author', type: 'text', required: true, label: '姓名' },
    { name: 'company', type: 'text', label: '公司／品牌' },
    {
      name: 'rating',
      type: 'number',
      required: true,
      defaultValue: 5,
      min: 1,
      max: 5,
      label: '評分（1~5）',
    },
    { name: 'order', type: 'number', defaultValue: 100, label: '排序' },
  ],
}
