import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface MemberSearchProps {
  onSelect: (member: Tables<"members">) => void;
  placeholder?: string;
}

export default function MemberSearch({ onSelect, placeholder = "搜索会员号或手机号..." }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tables<"members">[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("members")
      .select("*")
      .or(`member_no.ilike.%${value}%,phone.ilike.%${value}%,name.ilike.%${value}%`)
      .limit(10);
    setResults(data || []);
    setShowResults(true);
    setLoading(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {showResults && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">搜索中...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">未找到会员</div>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between"
                onMouseDown={() => {
                  onSelect(m);
                  setQuery(`${m.name} (${m.member_no})`);
                  setShowResults(false);
                }}
              >
                <div>
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.member_no}</span>
                </div>
                <span className="text-sm text-muted-foreground">{m.phone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
