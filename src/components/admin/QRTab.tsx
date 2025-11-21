import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download } from "lucide-react";

// Simple QR code generator using a library or API
const generateQRCode = (text: string): string => {
  // Using a free QR code API
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
};

export const QRTab = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const generateQR = () => {
    const text = `Email: ${email}\nPassword: ${password}`;
    setQrUrl(generateQRCode(text));
  };

  const downloadQR = () => {
    if (qrUrl) {
      const link = document.createElement("a");
      link.href = qrUrl;
      link.download = `qr-code-${email.split("@")[0]}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <Button onClick={generateQR} className="w-full bg-gradient-primary">
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        </CardContent>
      </Card>

      {qrUrl && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <img src={qrUrl} alt="QR Code" className="border border-border rounded-lg" />
            <Button onClick={downloadQR} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Email: {email}</p>
              <p>Password: {password}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

