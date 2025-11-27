import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Search } from "lucide-react";

export interface DriveFilters {
  query: string;
  mimeType: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string;
}

interface SearchFiltersProps {
  filters: DriveFilters;
  onChange: (filters: DriveFilters) => void;
  onSearch: (filters: DriveFilters) => void;
  onReset: () => void;
}

export const SearchFilters = ({ filters, onChange, onSearch, onReset }: SearchFiltersProps) => {
  const handleSearch = () => onSearch(filters);

  return (
    <div className="w-full space-y-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtros rápidos
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.mimeType}
          onValueChange={(value) => onChange({ ...filters, mimeType: value })}
        >
          <SelectTrigger className="w-full lg:w-[220px]">
            <SelectValue placeholder="Tipo de arquivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="folder">Pastas</SelectItem>
            <SelectItem value="application/pdf">PDF</SelectItem>
            <SelectItem value="image">Imagens</SelectItem>
            <SelectItem value="application/vnd.google-apps.document">Documentos</SelectItem>
            <SelectItem value="application/vnd.google-apps.spreadsheet">Planilhas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="tags">
            Tags / metadados
          </label>
          <Input
            id="tags"
            placeholder="cliente, projeto, tipo..."
            value={filters.tags}
            onChange={(e) => onChange({ ...filters, tags: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="dateFrom">
            Data inicial
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="dateTo">
            Data final
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Button className="w-full" onClick={handleSearch}>
            Buscar
          </Button>
          <Button variant="outline" onClick={onReset} className="whitespace-nowrap">
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};
