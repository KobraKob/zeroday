import { Signal, SignalType } from "../schema";
import { loadSignals } from "./dataLoader";

export interface SignalFilterOptions {
  type?: SignalType;
  city?: string;
  startDate?: string;
  endDate?: string;
}

export const signalsRepo = {
  getAll(): Signal[] {
    return [...loadSignals()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  getById(id: string): Signal | undefined {
    return loadSignals().find((s) => s.id === id);
  },

  getByGcc(gccId: string): Signal[] {
    return loadSignals().filter((s) => s.gcc_id === gccId);
  },

  getByCompany(companyName: string): Signal[] {
    const q = companyName.toLowerCase().trim();
    return loadSignals().filter((s) => s.company_name.toLowerCase().trim() === q);
  },

  filter(options: SignalFilterOptions = {}): Signal[] {
    let signals = this.getAll();

    if (options.type) {
      signals = signals.filter((s) => s.type === options.type);
    }
    if (options.city) {
      signals = signals.filter((s) => s.city === options.city);
    }
    if (options.startDate) {
      signals = signals.filter((s) => s.date >= options.startDate!);
    }
    if (options.endDate) {
      signals = signals.filter((s) => s.date <= options.endDate!);
    }

    return signals;
  },
};
