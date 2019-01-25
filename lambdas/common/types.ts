export interface ICinema {
  title: string;
  website: string | null;
  contacts: ICinemaContact[];
  schedule: ISchedulePeriod[];
}

export interface ICinemaContact {
  mobile?: string;
}

export interface ISchedulePeriod {
  start: string | null;
  end: string | null;
  halls: ICinemaHall[];
}

export interface ICinemaHall {
  name: string | null;
  places: number | null;
  sessions: ICinemaSession[];
}

export interface ICinemaSession {
  title?: string | null;
  format?: string | null;
  time?: string | null;
  price?: number | null;
}
