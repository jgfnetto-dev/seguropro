export interface Corretora {
  id: string
  nome: string
  criado_em: string
}

export interface Usuario {
  id: string
  corretora_id: string
  email: string
  nome: string
  telefone_whatsapp?: string
  adm?: 'S' | 'N'
  senha_deve_ser_alterada?: boolean
  criado_em: string
}

export interface Seguradora {
  id: string
  corretora_id: string
  codigo: string
  nome: string
  ramos: string[]
  criado_em: string
}

export interface Cliente {
  id: string
  corretora_id: string
  segurado: string
  cpf_cnpj: string
  email?: string
  telefone?: string
  pf_pj: 'PF' | 'PJ'
  criado_em: string
}

export interface Apolice {
  id: string
  corretora_id: string
  cliente_id: string
  seguradora_id: string
  numero_apolice: string
  data_emissao: string
  data_inicio: string
  data_fim: string
  tipo_seguro: string
  premio_liquido: number
  premio_total: number
  comissao_percentual?: number
  pdf_url?: string
  vendedor?: string
  criado_em: string
  cliente?: Cliente
  seguradora?: Seguradora
}

export interface ApoliceComRelacoes extends Apolice {
  cliente: Cliente
  seguradora: Seguradora
}

export type RamoSeguro =
  | 'Auto'
  | 'Vida'
  | 'Residencial'
  | 'Empresarial'
  | 'Saúde'
  | 'Dental'
  | 'Rural'
  | 'Frotas'
  | 'Previdência'
  | 'Outros'

export type TipoSeguro =
  | 'Automóvel'
  | 'Vida'
  | 'Residencial'
  | 'Empresarial'
  | 'Saúde'
  | 'Dental'
  | 'Rural'
  | 'Frota'
  | 'Previdência'
  | 'Outros'

export interface StatusRenovacao {
  id: string
  corretora_id: string
  apolice_id: string
  numero_apolice: string
  data: string
  status: 'Proposta' | 'Renovada' | 'Cancelada'
  observacao?: string
  criado_em: string
}

export interface Conciliacao {
  id: string
  corretora_id: string
  apolice_id: string
  numero_apolice: string
  data_conciliacao: string
  valor_conciliar: number
  comentario?: string
  criado_em: string
}

export interface Endosso {
  id: string
  corretora_id: string
  apolice_id: string
  numero_apolice: string
  numero_endosso: string
  tipo_endosso?: string
  segurado?: string
  data_emissao?: string
  data_inicio?: string
  data_fim?: string
  veiculo?: string
  ano?: string
  modelo?: string
  placa?: string
  chassi?: string
  pdf_url?: string
  criado_em: string
}

export interface EndossoExtractResult {
  numero_endosso?: string
  tipo_endosso?: string
  segurado?: string
  data_emissao?: string
  data_inicio?: string
  data_fim?: string
  veiculo?: string
  ano?: string
  modelo?: string
  placa?: string
  chassi?: string
}

export interface HistoricoRenovacao {
  id: string
  corretora_id: string
  numero_apolice: string
  status_final: 'Renovada' | 'Cancelada'
  apolice: Apolice
  cliente: Cliente
  seguradora?: Seguradora | null
  conciliacoes: Conciliacao[]
  endossos: Endosso[]
  status_renovacoes: StatusRenovacao[]
  arquivado_em: string
}

export interface Tarefa {
  id: string
  corretora_id: string
  usuario_id: string
  data: string
  hora: string
  tarefa: string
  whatsapp_enviado: boolean
  criado_em: string
}

export interface PdfExtractResult {
  segurado?: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
  numero_apolice?: string
  data_emissao?: string
  data_inicio?: string
  data_fim?: string
  seguradora?: string
  premio_liquido?: number
  premio_total?: number
  tipo_seguro?: string
}
