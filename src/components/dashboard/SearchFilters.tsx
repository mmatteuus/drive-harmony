import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (query: string, filters: any) => void;
}

export const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [query, setQuery] = useState("");
  const [mimeType, setMimeType] = useState<string>("");

  const handleSearch = () => {
    onSearch(query, { mimeType });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar arquivos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10"
        />
      </div>
      
      <Select value={mimeType} onValueChange={setMimeType}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Tipo de arquivo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="application/vnd.google-apps.folder">Pastas</SelectItem>
          <SelectItem value="application/pdf">PDF</SelectItem>
          <SelectItem value="image/">Imagens</SelectItem>
          <SelectItem value="application/vnd.google-apps.document">Documentos</SelectItem>
          <SelectItem value="application/vnd.google-apps.spreadsheet">Planilhas</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleSearch}>
        Buscar
      </Button>
    </div>
  );
};
