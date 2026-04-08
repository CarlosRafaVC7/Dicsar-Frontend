export interface ClienteDTO {
  idCliente?: number;
  nombre: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  telefono: string;
  email: string;
  razonSocial?: string | null;
  esEmpresa: boolean;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  nombreCompleto?: string;
}

export interface ClienteFormData {
  nombre: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string;
  telefono: string;
  email: string;
  razonSocial?: string;
  esEmpresa: boolean;
}
