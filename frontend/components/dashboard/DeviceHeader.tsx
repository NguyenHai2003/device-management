interface DeviceHeaderProps {
  macAddress: string;
  testId?: string;
}

export function DeviceHeader({ macAddress, testId }: DeviceHeaderProps) {
  return (
    <div className="mb-6" data-testid={testId}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span>Device Management</span>
      </div>
      <h1 className="text-3xl font-bold text-foreground">
        Device <span className="text-primary">{macAddress}</span>
      </h1>
    </div>
  );
}
