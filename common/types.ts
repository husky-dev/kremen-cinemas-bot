export interface ICinemaSession {
  time: string;
  hall?: string;
  format: string;
  price: number;
}

export interface ICinemaMovie {
  title: string;
  descr?: string;
  sessions: ICinemaSession[];
}

export interface IContact {
  mobile?: string;
}

export interface ICinema {
  title: string;
  website: string | null;
  contacts: IContact[];
  movies: ICinemaMovie[];
}
