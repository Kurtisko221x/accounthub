import { supabase } from "@/integrations/supabase/client";

export const logActivity = async (
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any
) => {
  try {
    await supabase.rpc("log_activity", {
      p_action: action,
      p_entity_type: entityType || null,
      p_entity_id: entityId || null,
      p_details: details || null,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

