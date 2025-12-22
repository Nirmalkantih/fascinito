import api from './api'

export interface InvoiceTemplate {
  id: number
  templateId: string
  name: string
  description: string
  templateType: 'REGULAR' | 'FESTIVAL' | 'PROMOTIONAL' | 'VIP'
  subject: string
  headerColor: string
  footerNote: string
  logoUrl: string
  bannerUrl: string
  showFestivalBanner: boolean
  active: boolean
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceTemplateRequest {
  templateId: string
  name: string
  description: string
  templateType: 'REGULAR' | 'FESTIVAL' | 'PROMOTIONAL' | 'VIP'
  subject: string
  headerColor: string
  footerNote: string
  logoUrl: string
  bannerUrl: string
  showFestivalBanner: boolean
  active: boolean
}

export interface Invoice {
  id: number
  invoiceNumber: string
  orderId: number
  orderNumber: string
  userId: number
  customerName: string
  customerEmail: string
  invoiceTemplateId: number
  templateName: string
  filePath: string
  fileUrl: string
  emailSent: boolean
  emailSentAt: string
  regeneratedCount: number
  generatedAt: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}

class InvoiceService {
  // Invoice Template APIs
  async getAllTemplates(page = 0, size = 10) {
    const response = await api.get('/invoice-templates', {
      params: { page, size }
    })
    return response.data.data
  }

  async getActiveTemplates() {
    const response = await api.get('/invoice-templates/active')
    return response.data.data
  }

  async getTemplateById(id: number) {
    const response = await api.get(`/invoice-templates/${id}`)
    return response.data.data
  }

  async createTemplate(data: InvoiceTemplateRequest) {
    const response = await api.post('/invoice-templates', data)
    return response.data.data
  }

  async updateTemplate(id: number, data: InvoiceTemplateRequest) {
    const response = await api.put(`/invoice-templates/${id}`, data)
    return response.data.data
  }

  async deleteTemplate(id: number) {
    const response = await api.delete(`/invoice-templates/${id}`)
    return response.data
  }

  async searchTemplates(search: string, page = 0, size = 10) {
    const response = await api.get('/invoice-templates/search', {
      params: { search, page, size }
    })
    return response.data.data
  }

  // Invoice APIs
  async getInvoiceByOrderId(orderId: number) {
    const response = await api.get(`/invoices/order/${orderId}`)
    return response.data.data
  }

  async getInvoiceById(invoiceId: number) {
    const response = await api.get(`/invoices/${invoiceId}`)
    return response.data.data
  }

  async getMyInvoices(page = 0, size = 10) {
    const response = await api.get('/invoices/my-invoices', {
      params: { page, size }
    })
    return response.data.data
  }

  async generateInvoice(orderId: number, templateId?: number) {
    const params: any = {}
    if (templateId) params.templateId = templateId
    const response = await api.post(`/invoices/generate/${orderId}`, null, { params })
    return response.data.data
  }

  async regenerateInvoice(invoiceId: number) {
    const response = await api.post(`/invoices/${invoiceId}/regenerate`)
    return response.data.data
  }

  async resendInvoiceEmail(invoiceId: number) {
    const response = await api.post(`/invoices/${invoiceId}/resend-email`)
    return response.data
  }

  async getAllInvoices(page = 0, size = 10) {
    const response = await api.get('/invoices/admin/all', {
      params: { page, size }
    })
    return response.data.data
  }

  async searchInvoices(search: string, page = 0, size = 10) {
    const response = await api.get('/invoices/admin/search', {
      params: { search, page, size }
    })
    return response.data.data
  }

  async downloadInvoice(invoiceId: number) {
    // Opens invoice PDF in new tab
    const invoice = await this.getInvoiceById(invoiceId)
    window.open(invoice.fileUrl, '_blank')
  }
}

export default new InvoiceService()
