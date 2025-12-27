import { useState, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Sparkles, Zap } from "lucide-react";
import Navigation from "@/components/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function KingFrankensteinQRPage() {
  const [qrData, setQrData] = useState("https://getcodexpay.com");
  const [gradientStyle, setGradientStyle] = useState("cosmic");
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  const gradientStyles = {
    cosmic: {
      name: "👑 King Frankenstein Cosmic",
      dots: {
        type: 'linear' as const,
        rotation: 135,
        colorStops: [
          { offset: 0, color: '#FF6B35' },
          { offset: 0.3, color: '#F72585' },
          { offset: 0.6, color: '#7209B7' },
          { offset: 1, color: '#3A0CA3' }
        ]
      },
      background: {
        type: 'radial' as const,
        colorStops: [
          { offset: 0, color: '#0A2463' },
          { offset: 1, color: '#1E3A8A' }
        ]
      }
    },
    psychedelic: {
      name: "🌈 Psychedelic Rainbow",
      dots: {
        type: 'linear' as const,
        rotation: 45,
        colorStops: [
          { offset: 0, color: '#667eea' },
          { offset: 0.25, color: '#764ba2' },
          { offset: 0.5, color: '#f093fb' },
          { offset: 0.75, color: '#f5576c' },
          { offset: 1, color: '#4facfe' }
        ]
      },
      background: {
        type: 'linear' as const,
        rotation: 90,
        colorStops: [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#1a1a2e' }
        ]
      }
    },
    neon: {
      name: "⚡ Neon Electric",
      dots: {
        type: 'linear' as const,
        rotation: 90,
        colorStops: [
          { offset: 0, color: '#00f5ff' },
          { offset: 0.5, color: '#ff00ff' },
          { offset: 1, color: '#ff1744' }
        ]
      },
      background: {
        type: 'radial' as const,
        colorStops: [
          { offset: 0, color: '#0d0221' },
          { offset: 1, color: '#000000' }
        ]
      }
    },
    fire: {
      name: "🔥 Fire & Ice",
      dots: {
        type: 'linear' as const,
        rotation: 180,
        colorStops: [
          { offset: 0, color: '#FF0080' },
          { offset: 0.5, color: '#FF8C00' },
          { offset: 1, color: '#FFD700' }
        ]
      },
      background: {
        type: 'radial' as const,
        colorStops: [
          { offset: 0, color: '#2C003E' },
          { offset: 1, color: '#000428' }
        ]
      }
    }
  };

  useEffect(() => {
    if (!qrRef.current) return;

    const style = gradientStyles[gradientStyle as keyof typeof gradientStyles];
    
    const qrCode = new QRCodeStyling({
      width: 400,
      height: 400,
      type: "svg",
      data: qrData,
      dotsOptions: {
        type: "extra-rounded",
        gradient: style.dots
      },
      backgroundOptions: {
        gradient: style.background
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        gradient: {
          type: 'linear',
          rotation: 0,
          colorStops: [
            { offset: 0, color: '#FFD700' },
            { offset: 1, color: '#FF6B35' }
          ]
        }
      },
      cornersDotOptions: {
        type: "dot",
        color: '#FFFFFF'
      },
      qrOptions: {
        errorCorrectionLevel: "H"
      }
    });

    qrRef.current.innerHTML = '';
    qrCode.append(qrRef.current);
    qrCodeRef.current = qrCode;
  }, [qrData, gradientStyle]);

  const handleDownload = (extension: 'svg' | 'png') => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ 
        name: `king-frankenstein-qr-${Date.now()}`, 
        extension 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 blur-3xl -z-10" />
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
            👑 King of Frankenstein QR Generator
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Create cosmic, psychedelic QR codes with unstoppable energy! 
            <span className="block text-sm mt-2 text-orange-300">✨ Based on the legendary King of Frankenstein aesthetic ✨</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* QR Code Display */}
          <Card className="bg-black/40 border-2 border-purple-500/50 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-500/30">
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Sparkles className="text-yellow-400" />
                Your Cosmic QR Code
              </CardTitle>
              <CardDescription className="text-purple-200">
                Scan me and enter the cosmos!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8">
              {/* QR Code Container with Cosmic Border */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
                <div 
                  ref={qrRef} 
                  className="relative bg-gradient-to-br from-slate-900 to-purple-950 p-6 rounded-2xl shadow-2xl"
                  data-testid="qr-code-display"
                />
              </div>

              {/* Download Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => handleDownload('svg')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="button-download-svg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>
                <Button 
                  onClick={() => handleDownload('png')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  data-testid="button-download-png"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-black/40 border-2 border-blue-500/50 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-500/30">
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Zap className="text-yellow-400" />
                Customize Your QR
              </CardTitle>
              <CardDescription className="text-blue-200">
                Control the cosmic energy!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* QR Data Input */}
              <div className="space-y-2">
                <Label htmlFor="qr-data" className="text-white text-lg">
                  QR Code Data / URL
                </Label>
                <Input
                  id="qr-data"
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="Enter URL or text..."
                  className="bg-slate-900/50 border-purple-500/50 text-white placeholder:text-purple-300/50 text-lg h-12"
                  data-testid="input-qr-data"
                />
                <p className="text-sm text-purple-300">
                  Enter any URL, text, or data you want to encode
                </p>
              </div>

              {/* Gradient Style Selector */}
              <div className="space-y-2">
                <Label htmlFor="gradient-style" className="text-white text-lg">
                  Cosmic Style
                </Label>
                <Select value={gradientStyle} onValueChange={setGradientStyle}>
                  <SelectTrigger 
                    id="gradient-style"
                    className="bg-slate-900/50 border-purple-500/50 text-white h-12"
                    data-testid="select-gradient-style"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-500/50">
                    {Object.entries(gradientStyles).map(([key, style]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        className="text-white hover:bg-purple-500/20"
                      >
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style Preview Cards */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {Object.entries(gradientStyles).map(([key, style]) => (
                  <div
                    key={key}
                    onClick={() => setGradientStyle(key)}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                      gradientStyle === key 
                        ? 'ring-2 ring-yellow-400 scale-105' 
                        : 'hover:scale-105 opacity-70'
                    }`}
                    style={{
                      background: style.background.type === 'radial'
                        ? `radial-gradient(circle, ${style.background.colorStops.map((s: any) => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        : `linear-gradient(${style.background.colorStops.map((s: any) => `${s.color} ${s.offset * 100}%`).join(', ')})`
                    }}
                    data-testid={`card-style-${key}`}
                  >
                    <div className="text-white text-sm font-bold text-center bg-black/50 rounded px-2 py-1">
                      {style.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Motto */}
              <div className="pt-6 border-t border-purple-500/30">
                <blockquote className="text-center italic text-purple-200 text-lg">
                  "Never knowing the outcome, only believe in yourself"
                </blockquote>
                <p className="text-center text-orange-400 font-bold mt-2">
                  - CODEX Philosophy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Cosmic Gradients</h3>
              <p className="text-purple-200">
                4 psychedelic styles inspired by King of Frankenstein
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Download className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Download Ready</h3>
              <p className="text-orange-200">
                Export as SVG or PNG for any use case
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">High Quality</h3>
              <p className="text-blue-200">
                Scannable QR codes with maximum error correction
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
