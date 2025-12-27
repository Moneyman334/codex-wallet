import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Percent, DollarSign, Calendar, Users } from "lucide-react";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: string;
  minPurchase: string | null;
  maxDiscount: string | null;
  usageLimit: string | null;
  usageCount: string;
  validFrom: string;
  validUntil: string | null;
  isActive: string;
  applicableProducts: string[] | null;
  createdAt: string;
}

export default function AdminDiscounts() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    validUntil: "",
  });

  // Fetch discount codes
  const { data: discounts, isLoading } = useQuery<DiscountCode[]>({
    queryKey: ['/api/discounts'],
  });

  // Create discount mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/discounts', data);
    },
    onSuccess: () => {
      toast({
        title: "Discount Code Created",
        description: "The discount code has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      setShowForm(false);
      setFormData({
        code: "",
        type: "percentage",
        value: "",
        minPurchase: "",
        maxDiscount: "",
        usageLimit: "",
        validUntil: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
    };
    
    if (formData.minPurchase) payload.minPurchase = formData.minPurchase;
    if (formData.maxDiscount) payload.maxDiscount = formData.maxDiscount;
    if (formData.usageLimit) payload.usageLimit = formData.usageLimit;
    if (formData.validUntil) payload.validUntil = formData.validUntil;
    
    createMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discount Code Management</h1>
        <p className="text-muted-foreground">Create and manage promotional discount codes for your store</p>
      </div>

      <div className="grid gap-6">
        {/* Create Discount Form */}
        {!showForm ? (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full"
                data-testid="button-create-discount"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Discount Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create Discount Code</CardTitle>
              <CardDescription>Set up a new promotional discount for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Discount Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="SUMMER2024"
                      required
                      data-testid="input-code"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Will be converted to uppercase</p>
                  </div>

                  <div>
                    <Label htmlFor="type">Discount Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="value">
                      {formData.type === "percentage" ? "Percentage (%)" : "Amount ($)"}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === "percentage" ? "10" : "5.00"}
                      required
                      data-testid="input-value"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minPurchase">Minimum Purchase ($)</Label>
                    <Input
                      id="minPurchase"
                      type="number"
                      step="0.01"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                      placeholder="Optional"
                      data-testid="input-min-purchase"
                    />
                  </div>

                  {formData.type === "percentage" && (
                    <div>
                      <Label htmlFor="maxDiscount">Maximum Discount ($)</Label>
                      <Input
                        id="maxDiscount"
                        type="number"
                        step="0.01"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                        placeholder="Optional"
                        data-testid="input-max-discount"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited"
                      data-testid="input-usage-limit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="validUntil">Expiry Date</Label>
                    <Input
                      id="validUntil"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      data-testid="input-expiry"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Discount Code"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Discount Codes List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Discount Codes</CardTitle>
            <CardDescription>Manage existing promotional codes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading discount codes...</p>
              </div>
            ) : !discounts || discounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No discount codes created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    data-testid={`discount-${discount.code}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{discount.code}</h3>
                          {discount.isActive === "true" ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {discount.type === "percentage" ? (
                              <Percent className="h-4 w-4" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            <span>
                              {discount.type === "percentage" 
                                ? `${discount.value}% off`
                                : `$${discount.value} off`
                              }
                            </span>
                          </div>

                          {discount.usageLimit && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>
                                {discount.usageCount}/{discount.usageLimit} used
                              </span>
                            </div>
                          )}

                          {discount.validUntil && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Expires: {new Date(discount.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {discount.minPurchase && (
                          <p className="text-xs text-muted-foreground">
                            Minimum purchase: ${discount.minPurchase}
                          </p>
                        )}

                        {discount.maxDiscount && (
                          <p className="text-xs text-muted-foreground">
                            Maximum discount: ${discount.maxDiscount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
