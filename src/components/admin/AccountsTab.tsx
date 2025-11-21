import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Upload, Search, CheckSquare, XSquare, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { validateAccount, checkAccountPlausibility, testServiceConnectivity } from "@/lib/accountValidator";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
}

interface Account {
  id: string;
  email: string;
  password: string;
  is_used: boolean;
  category_id: string;
  categories: { name: string } | null;
  is_validated?: boolean;
  validation_status?: 'unknown' | 'valid' | 'invalid' | 'testing' | 'expired';
  last_validated_at?: string;
  validation_notes?: string;
}

export const AccountsTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [qualityLevel, setQualityLevel] = useState<'free' | 'vip'>('free');
  const [bulkData, setBulkData] = useState("");
  const [bulkQualityLevel, setBulkQualityLevel] = useState<'free' | 'vip'>('free');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [searchTerm, statusFilter, categoryFilter, qualityFilter, accounts]);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const loadAccounts = async () => {
    const { data } = await supabase
      .from("accounts")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (data) {
      setAccounts(data as Account[]);
      setFilteredAccounts(data as Account[]);
    }
  };

  const filterAccounts = () => {
    let filtered = [...accounts];

    if (searchTerm) {
      filtered = filtered.filter(
        (acc) =>
          acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.password.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((acc) =>
        statusFilter === "used" ? acc.is_used : !acc.is_used
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((acc) => acc.category_id === categoryFilter);
    }

    if (qualityFilter !== "all") {
      filtered = filtered.filter((acc) => {
        const quality = (acc as any).quality_level || 'free';
        return quality === qualityFilter;
      });
    }

    setFilteredAccounts(filtered);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select accounts to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Delete ${selectedIds.size} selected accounts?`)) return;

    const { error } = await supabase
      .from("accounts")
      .delete()
      .in("id", Array.from(selectedIds));

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${selectedIds.size} accounts deleted` });
      setSelectedIds(new Set());
      loadAccounts();
    }
  };

  const handleBulkMarkUsed = async (used: boolean) => {
    if (selectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select accounts",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("accounts")
      .update({ is_used: used, used_at: used ? new Date().toISOString() : null })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Success",
        description: `${selectedIds.size} accounts marked as ${used ? "used" : "available"}`,
      });
      setSelectedIds(new Set());
      loadAccounts();
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAccounts.map((acc) => acc.id)));
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      return;
    }

    const successRate = qualityLevel === 'vip' ? 90 : 10;

    const { error } = await supabase.from("accounts").insert({
      category_id: selectedCategory,
      email,
      password,
      quality_level: qualityLevel,
      success_rate: successRate,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Account added (${qualityLevel.toUpperCase()} - ${successRate}%)` });
      setEmail("");
      setPassword("");
      loadAccounts();
    }
  };

  const handleBulkImport = async () => {
    if (!selectedCategory) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      return;
    }

    if (!bulkData.trim()) {
      toast({ title: "Error", description: "Please enter accounts to import", variant: "destructive" });
      return;
    }

    const lines = bulkData.split("\n").filter((line) => line.trim());
    const successRate = bulkQualityLevel === 'vip' ? 90 : 10;
    
    const accounts = lines
      .map((line) => {
        const [email, password] = line.split(":");
        if (!email || !password) {
          return null;
        }
        return {
          category_id: selectedCategory,
          email: email.trim(),
          password: password.trim(),
          quality_level: bulkQualityLevel,
          success_rate: successRate,
        };
      })
      .filter((acc) => acc !== null); // Remove invalid entries

    if (accounts.length === 0) {
      toast({ 
        title: "Error", 
        description: "No valid accounts found. Format: email:password (one per line)",
        variant: "destructive" 
      });
      return;
    }

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      const { error } = await supabase.from("accounts").insert(batch);
      
      if (error) {
        errors++;
        console.error("Error importing batch:", error);
      } else {
        imported += batch.length;
      }
    }

    if (errors > 0) {
      toast({ 
        title: "Partial Success", 
        description: `Imported ${imported} accounts. ${errors} batch(es) failed.`,
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: `${imported} accounts imported (${bulkQualityLevel.toUpperCase()} - ${successRate}%)` 
      });
    }
    
    setBulkData("");
    loadAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return;

    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Account deleted" });
      loadAccounts();
    }
  };

  const handleValidateAccount = async (account: Account) => {
    if (validatingIds.has(account.id)) return;

    setValidatingIds(prev => new Set(prev).add(account.id));

    try {
      // Get category name
      const categoryName = account.categories?.name || 'Unknown';

      // Step 1: Basic validation
      const validation = await validateAccount(account.email, account.password, categoryName);
      
      // Step 2: Check plausibility
      const plausibility = checkAccountPlausibility(account.email, account.password);
      
      // Step 3: Test service connectivity (real test)
      const connectivity = await testServiceConnectivity(categoryName);
      
      // Determine final status based on all checks
      let finalStatus: 'valid' | 'invalid' | 'unknown' = 'unknown';
      let notes = '';

      if (!validation.isValid || !plausibility.isValid) {
        finalStatus = 'invalid';
        notes = `❌ FAILED: ${validation.message}. ${plausibility.message}`;
      } else if (validation.status === 'invalid') {
        finalStatus = 'invalid';
        notes = `❌ FAILED: ${validation.message}`;
      } else if (validation.status === 'valid' && plausibility.isValid) {
        finalStatus = 'valid';
        notes = `✅ PASSED: Email format ✓, Password strength ✓, Credentials plausible ✓`;
        if (connectivity.isValid) {
          notes += `, Service accessible ✓`;
        }
        notes += `. ${validation.message}`;
      } else {
        finalStatus = 'unknown';
        notes = `⚠️ NEEDS MANUAL TEST: ${validation.message}. Service connectivity: ${connectivity.message}`;
      }

      // Update account via Supabase RPC function
      const { error } = await supabase.rpc('update_account_validation', {
        p_account_id: account.id,
        p_status: finalStatus,
        p_notes: notes,
        p_validated_by: null
      });

      if (error) {
        // Fallback: direct update if RPC doesn't exist yet
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            is_validated: finalStatus === 'valid',
            validation_status: finalStatus,
            last_validated_at: new Date().toISOString(),
            validation_notes: notes
          })
          .eq('id', account.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Validation Complete",
        description: `Account marked as ${finalStatus.toUpperCase()}`,
      });

      loadAccounts();
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate account",
        variant: "destructive",
      });
    } finally {
      setValidatingIds(prev => {
        const next = new Set(prev);
        next.delete(account.id);
        return next;
      });
    }
  };

  const handleBulkValidate = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select accounts to validate",
        variant: "destructive",
      });
      return;
    }

    const accountsToValidate = filteredAccounts.filter(acc => selectedIds.has(acc.id));
    
    toast({
      title: "Validating",
      description: `Validating ${accountsToValidate.length} accounts...`,
    });

    // Validate accounts one by one (to avoid overwhelming the system)
    for (const account of accountsToValidate) {
      await handleValidateAccount(account);
      // Small delay between validations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    toast({
      title: "Validation Complete",
      description: `Validated ${accountsToValidate.length} accounts`,
    });

    setSelectedIds(new Set());
    loadAccounts();
  };

  const handleManualValidation = async (accountId: string, status: 'valid' | 'invalid', notes?: string) => {
    try {
      const { error } = await supabase.rpc('update_account_validation', {
        p_account_id: accountId,
        p_status: status,
        p_notes: notes || `Manually marked as ${status} by admin`,
        p_validated_by: null
      });

      if (error) {
        // Fallback: direct update
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            is_validated: status === 'valid',
            validation_status: status,
            last_validated_at: new Date().toISOString(),
            validation_notes: notes || `Manually marked as ${status}`
          })
          .eq('id', accountId);

        if (updateError) throw updateError;
      }

      toast({
        title: "Updated",
        description: `Account marked as ${status.toUpperCase()}`,
      });

      loadAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update validation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle>Add Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Add */}
          <form onSubmit={handleAddSingle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Generator Type</Label>
                <Select value={qualityLevel} onValueChange={(value: 'free' | 'vip') => setQualityLevel(value)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">FREE (10% Success Rate)</SelectItem>
                    <SelectItem value="vip">VIP (90% Success Rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <Button type="submit" className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Account ({qualityLevel.toUpperCase()} - {qualityLevel === 'vip' ? '90%' : '10%'})
            </Button>
          </form>

          {/* Bulk Import */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label>Bulk Import (email:password format, one per line)</Label>
                <Textarea
                  placeholder="email1@example.com:password1&#10;email2@example.com:password2&#10;email3@example.com:password3"
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  rows={6}
                  className="bg-secondary border-border font-mono text-sm"
                />
              </div>
              <div className="space-y-2 w-[250px]">
                <Label>Generator Type for Bulk Import</Label>
                <Select value={bulkQualityLevel} onValueChange={(value: 'free' | 'vip') => setBulkQualityLevel(value)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">FREE (10% Success Rate)</SelectItem>
                    <SelectItem value="vip">VIP (90% Success Rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleBulkImport} variant="outline" className="border-accent text-accent">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import ({bulkQualityLevel.toUpperCase()} - {bulkQualityLevel === 'vip' ? '90%' : '10%'})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Account Stock ({filteredAccounts.length} of {accounts.length} total)
            </CardTitle>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkUsed(true)}
                  className="border-green-500 text-green-500"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Mark Used
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkUsed(false)}
                  className="border-blue-500 text-blue-500"
                >
                  <XSquare className="w-4 h-4 mr-2" />
                  Mark Available
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkValidate}
                  className="border-blue-500 text-blue-500"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Validate ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="border-red-500 text-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by email, password, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-secondary border-border">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-secondary border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">FREE</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredAccounts.length && filteredAccounts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(account.id)}
                          onCheckedChange={() => toggleSelect(account.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {account.categories?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (account as any).quality_level === 'vip'
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {((account as any).quality_level || 'free').toUpperCase()}
                          {' '}
                          ({(account as any).success_rate || ((account as any).quality_level === 'vip' ? 90 : 10)}%)
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{account.email}</TableCell>
                      <TableCell className="font-mono text-sm">{account.password}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            account.is_used
                              ? "bg-red-500/10 text-red-500"
                              : "bg-green-500/10 text-green-500"
                          }`}
                        >
                          {account.is_used ? "Used" : "Available"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {validatingIds.has(account.id) ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Testing...
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            {account.validation_status === 'valid' && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Valid
                              </Badge>
                            )}
                            {account.validation_status === 'invalid' && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50">
                                <XCircle className="w-3 h-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                            {(account.validation_status === 'unknown' || !account.validation_status) && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Unknown
                              </Badge>
                            )}
                            {account.validation_status === 'expired' && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/50">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleValidateAccount(account)}
                            disabled={validatingIds.has(account.id)}
                            className="hover:bg-blue-500/10 hover:text-blue-500"
                            title="Auto-validate account"
                          >
                            {validatingIds.has(account.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleManualValidation(account.id, 'valid', 'Manually tested and working')}
                            className="hover:bg-green-500/10 hover:text-green-500"
                            title="Mark as Valid (manually tested)"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleManualValidation(account.id, 'invalid', 'Manually tested and NOT working')}
                            className="hover:bg-red-500/10 hover:text-red-500"
                            title="Mark as Invalid (not working)"
                          >
                            <XSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(account.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
