export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      fixtures: {
        Row: {
          txline_fixture_id: number;
          home_name: string | null;
          away_name: string | null;
          kickoff_at: string | null;
          phase: string | null;
          updated_at: string | null;
        };
        Insert: {
          txline_fixture_id: number;
          home_name?: string | null;
          away_name?: string | null;
          kickoff_at?: string | null;
          phase?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["fixtures"]["Insert"]>;
      };
      pulses: {
        Row: {
          id: string;
          fixture_id: number | null;
          pulse_type: string;
          question: string;
          opens_at: string;
          closes_at: string;
          line_pct: number | null;
          crowd_yes_pct: number | null;
          status: string | null;
          onchain_pool_pubkey: string | null;
          odds_message_id: string | null;
          odds_proof: Json | null;
          settlement_root: string | null;
          winning_side: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          fixture_id?: number | null;
          pulse_type: string;
          question: string;
          opens_at: string;
          closes_at: string;
          line_pct?: number | null;
          crowd_yes_pct?: number | null;
          status?: string | null;
          onchain_pool_pubkey?: string | null;
          odds_message_id?: string | null;
          odds_proof?: Json | null;
          settlement_root?: string | null;
          winning_side?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pulses"]["Insert"]>;
      };
      positions: {
        Row: {
          id: string;
          pulse_id: string | null;
          user_id: string | null;
          agent_id: string | null;
          side: "yes" | "no" | null;
          stake: number;
          onchain_position_pubkey: string | null;
          result: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          pulse_id?: string | null;
          user_id?: string | null;
          agent_id?: string | null;
          side?: "yes" | "no" | null;
          stake: number;
          onchain_position_pubkey?: string | null;
          result?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          wallet_pubkey: string;
          onchain_agent_pubkey: string | null;
          config: Json | null;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          wallet_pubkey: string;
          onchain_agent_pubkey?: string | null;
          config?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      agent_secrets: {
        Row: {
          agent_id: string;
          provider: string;
          encrypted_api_key: string;
          encrypted_wallet_secret: string | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          provider: string;
          encrypted_api_key: string;
          encrypted_wallet_secret?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["agent_secrets"]["Insert"]
        >;
      };
      agent_claim_codes: {
        Row: {
          code: string;
          agent_id: string | null;
          expires_at: string;
          claimed_at: string | null;
          claimed_by_wallet: string | null;
          created_at: string | null;
        };
        Insert: {
          code: string;
          agent_id?: string | null;
          expires_at: string;
          claimed_at?: string | null;
          claimed_by_wallet?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["agent_claim_codes"]["Insert"]
        >;
      };
      agent_trades: {
        Row: {
          id: string;
          agent_id: string | null;
          pulse_id: string | null;
          side: string | null;
          stake: number | null;
          reasoning: string | null;
          signature: string | null;
          execute_tx: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id?: string | null;
          pulse_id?: string | null;
          side?: string | null;
          stake?: number | null;
          reasoning?: string | null;
          signature?: string | null;
          execute_tx?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_trades"]["Insert"]>;
      };
      rooms: {
        Row: {
          id: string;
          slug: string;
          fixture_id: number | null;
          owner_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          fixture_id?: number | null;
          owner_id?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          duel_points: number | null;
        };
        Insert: {
          room_id: string;
          user_id: string;
          duel_points?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["room_members"]["Insert"]>;
      };
      receipts: {
        Row: {
          id: string;
          user_id: string | null;
          pulse_id: string | null;
          label: string | null;
          og_image_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          pulse_id?: string | null;
          label?: string | null;
          og_image_url?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["receipts"]["Insert"]>;
      };
      proof_bundles: {
        Row: {
          pulse_id: string;
          truth_json: Json | null;
          settlement_json: Json | null;
          verify_tx: string | null;
          bundle_json: Json | null;
          created_at: string | null;
        };
        Insert: {
          pulse_id: string;
          truth_json?: Json | null;
          settlement_json?: Json | null;
          verify_tx?: string | null;
          bundle_json?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["proof_bundles"]["Insert"]
        >;
      };
      simulator_sessions: {
        Row: {
          id: string;
          fixture_id: number | null;
          bundle: Json | null;
          cursor: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          fixture_id?: number | null;
          bundle?: Json | null;
          cursor?: number | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["simulator_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      copy_subscriptions: {
        Row: {
          user_id: string;
          agent_id: string;
          max_stake: number | null;
          mode: "copy" | "fade" | null;
        };
        Insert: {
          user_id: string;
          agent_id: string;
          max_stake?: number | null;
          mode?: "copy" | "fade" | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["copy_subscriptions"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
