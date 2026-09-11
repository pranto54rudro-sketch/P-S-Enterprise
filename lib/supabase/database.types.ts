export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      business_settings: { Row: { id:string; business_name:string; currency:string; unit_value:number; multiplier:number; daily_divisor:number; opening_capital:number; created_at:string; updated_at:string }; Insert: Partial<Database['public']['Tables']['business_settings']['Row']> & { id?:string }; Update: Partial<Database['public']['Tables']['business_settings']['Row']> };
      profiles: { Row: { id:string; full_name:string|null; role:string; created_at:string; updated_at:string }; Insert: { id:string; full_name?:string|null; role?:string }; Update: Partial<Database['public']['Tables']['profiles']['Row']> };
      parties: { Row: { id:string; name:string; phone:string|null; address:string|null; note:string|null; created_at:string; updated_at:string }; Insert: { name:string; phone?:string|null; address?:string|null; note?:string|null }; Update: Partial<Database['public']['Tables']['parties']['Row']> };
      transactions: { Row: { id:string; type:string; party_id:string|null; transaction_date:string; due_date:string|null; units:number; rate:number; amount:number; paid:number; return_paid:number; owner_funded:number; people_funded:number; note:string|null; created_by:string|null; created_at:string; updated_at:string }; Insert: Omit<Database['public']['Tables']['transactions']['Row'],'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }; Update: Partial<Database['public']['Tables']['transactions']['Row']> };
      buying_lots: { Row: { id:string; transaction_id:string; lot_date:string; units:number; unit_cost:number; owner_units:number; people_units:number; created_at:string }; Insert: { transaction_id:string; lot_date:string; units:number; unit_cost:number; owner_units?:number; people_units?:number }; Update: Partial<Database['public']['Tables']['buying_lots']['Row']> };
      fifo_allocations: { Row: { id:string; selling_transaction_id:string; buying_lot_id:string; units:number; unit_cost:number; cost_amount:number|null; created_at:string }; Insert: { selling_transaction_id:string; buying_lot_id:string; units:number; unit_cost:number }; Update: Partial<Database['public']['Tables']['fifo_allocations']['Row']> };
      payments: { Row: { id:string; transaction_id:string; payment_type:string; direction:string; amount:number; payment_date:string; note:string|null; created_by:string|null; created_at:string }; Insert: { transaction_id:string; payment_type:string; direction:string; amount:number; payment_date?:string; note?:string|null; created_by?:string|null }; Update: Partial<Database['public']['Tables']['payments']['Row']> };
      cash_entries: { Row: { id:string; entry_type:string; amount:number; entry_date:string; note:string|null; created_by:string|null; created_at:string }; Insert: { entry_type:string; amount:number; entry_date?:string; note?:string|null; created_by?:string|null }; Update: Partial<Database['public']['Tables']['cash_entries']['Row']> };
      audit_logs: { Row: { id:string; entity_type:string; entity_id:string|null; action:string; old_value:Json|null; new_value:Json|null; created_by:string|null; created_at:string }; Insert: { entity_type:string; entity_id?:string|null; action:string; old_value?:Json|null; new_value?:Json|null; created_by?:string|null }; Update: Partial<Database['public']['Tables']['audit_logs']['Row']> };
    };
    Functions: { is_owner_or_admin: { Args: Record<string, never>; Returns: boolean } };
  };
};
