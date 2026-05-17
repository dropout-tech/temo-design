import type { CollectionConfig } from 'payload'

export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
  labels: {
    singular: '作品',
    plural: '作品集',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year', 'order', 'published'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: '標題（中文）',
    },
    {
      name: 'subtitle',
      type: 'text',
      label: '英文副標',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: '網址 slug（英數，例：tea-brand）',
      admin: {
        description: '會用在 /portfolio/[slug] 路徑',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: '分類',
      options: [
        { label: '品牌設計', value: '品牌設計' },
        { label: '包裝設計', value: '包裝設計' },
        { label: '產品設計', value: '產品設計' },
        { label: '工藝設計', value: '工藝設計' },
        { label: '公共藝術', value: '公共藝術' },
      ],
    },
    {
      name: 'year',
      type: 'text',
      required: true,
      label: '年份',
    },
    {
      name: 'client',
      type: 'text',
      label: '客戶',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: '簡述（lightbox 用）',
    },
    {
      name: 'content',
      type: 'textarea',
      label: '完整內容（詳情頁用，可換行）',
    },
    {
      name: 'tags',
      type: 'array',
      label: '標籤',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: '封面圖（建議上傳，未上傳則用 coverUrl）',
    },
    {
      name: 'coverUrl',
      type: 'text',
      label: '封面圖 URL（fallback，例：/images/portfolio/xxx.jpg）',
    },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'medium',
      label: '版面尺寸',
      options: [
        { label: 'large（直立大圖）', value: 'large' },
        { label: 'medium（正方）', value: 'medium' },
        { label: 'small（橫式小圖）', value: 'small' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      label: '排序（小的在前）',
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      label: '上架顯示',
    },
  ],
}
