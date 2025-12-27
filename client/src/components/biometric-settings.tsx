import { useBiometric } from '@/hooks/use-biometric';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BiometricSettings() {
  const {
    isAvailable,
    isNative,
    biometryTypeName,
    isEnabled,
    isLoading,
    enableBiometric,
    disableBiometric,
  } = useBiometric();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card data-testid="biometric-settings-loading">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isNative) {
    return null;
  }

  const getBiometricIcon = () => {
    if (biometryTypeName === 'Face ID' || biometryTypeName === 'Face Authentication') {
      return <Scan className="h-5 w-5" />;
    }
    return <Fingerprint className="h-5 w-5" />;
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await enableBiometric();
      if (success) {
        toast({
          title: `${biometryTypeName} Enabled`,
          description: `You can now use ${biometryTypeName} for secure actions.`,
        });
      } else {
        toast({
          title: 'Authentication Failed',
          description: `Could not enable ${biometryTypeName}. Please try again.`,
          variant: 'destructive',
        });
      }
    } else {
      const success = await disableBiometric();
      if (success) {
        toast({
          title: `${biometryTypeName} Disabled`,
          description: `${biometryTypeName} authentication has been disabled.`,
        });
      } else {
        toast({
          title: 'Authentication Failed',
          description: 'Could not disable biometric. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card data-testid="biometric-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Protect sensitive actions with biometric authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between" data-testid="biometric-toggle-container">
          <div className="flex items-center gap-3">
            {getBiometricIcon()}
            <div>
              <Label htmlFor="biometric-toggle" className="text-base font-medium">
                {biometryTypeName}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isAvailable 
                  ? `Use ${biometryTypeName} to secure transactions and wallet actions`
                  : `${biometryTypeName} is not available on this device`
                }
              </p>
            </div>
          </div>
          <Switch
            id="biometric-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!isAvailable}
            data-testid="biometric-toggle"
          />
        </div>
        
        {isEnabled && (
          <div className="rounded-lg bg-primary/10 p-3 text-sm" data-testid="biometric-enabled-info">
            <p className="text-primary">
              {biometryTypeName} is enabled. You'll be asked to authenticate for:
            </p>
            <ul className="mt-2 list-disc list-inside text-muted-foreground">
              <li>Sending transactions</li>
              <li>Staking or unstaking</li>
              <li>Disconnecting your wallet</li>
              <li>Viewing sensitive data</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
