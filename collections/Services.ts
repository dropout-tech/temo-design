import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: '服務', plural: '服務項目' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'titleEn', 'order'] },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', required: true, label: '服務名稱（中文）' },
    { name: 'titleEn', type: 'text', label: '英文名稱' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'URL slug' },
    { name: 'description', type: 'textarea', required: true, label: '簡述' },
    { name: 'details', type: 'textarea', label: '詳細介紹' },
    { name: 'portfolioCount', type: 'number', label: '相關作品數', defaultValue: 0 },
    { name: 'order', type: 'number', defaultValue: 100, label: '排序（小的在前）' },
  ],
}
