import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, User, Activity } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_id: string | null;
}

export const ActivityLogTab = () => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchTerm, actionFilter, activities]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      if (data) {
        setActivities(data);
        setFilteredActivities(data);
      }
    } catch (error: any) {
      console.error("Error loading activities:", error);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((activity) => activity.action === actionFilter);
    }

    setFilteredActivities(filtered);
  };

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "➕";
    if (action.includes("update") || action.includes("edit")) return "✏️";
    if (action.includes("delete") || action.includes("remove")) return "🗑️";
    if (action.includes("export")) return "📥";
    if (action.includes("import")) return "📤";
    return "📝";
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "text-green-500";
    if (action.includes("update") || action.includes("edit")) return "text-blue-500";
    if (action.includes("delete") || action.includes("remove")) return "text-red-500";
    return "text-muted-foreground";
  };

  const uniqueActions = Array.from(new Set(activities.map((a) => a.action)));

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getActionIcon(activity.action)}</span>
                          <span className={`font-medium ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.entity_type && (
                          <span className="text-sm text-muted-foreground">
                            {activity.entity_type}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.details && (
                          <pre className="text-xs bg-secondary p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

