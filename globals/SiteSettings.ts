import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '網站設定',
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, label: '網站名稱' },
    { name: 'description', type: 'textarea', required: true, label: '網站描述' },
    { name: 'email', type: 'email', required: true, label: '聯絡 Email' },
    { name: 'phone', type: 'text', required: true, label: '聯絡電話' },
    { name: 'address', type: 'text', required: true, label: '地址' },
    {
      name: 'socialLinks',
      type: 'group',
      label: '社群連結',
      fields: [
        { name: 'instagram', type: 'text', label: 'Instagram URL' },
        { name: 'facebook', type: 'text', label: 'Facebook URL' },
        { name: 'behance', type: 'text', label: 'Behance URL' },
      ],
    },
  ],
}
