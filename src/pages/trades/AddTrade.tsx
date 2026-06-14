import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import JournalEditor from '@/components/JournalEditor';
import { Upload, ArrowLeft, Briefcase, Clock, Activity, Target, Crosshair, DollarSign, Image as ImageIcon } from 'lucide-react';

export default function AddTrade() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [setupsList, setSetupsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [accountId, setAccountId] = useState('');
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tradeTime, setTradeTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [pair, setPair] = useState('XAUUSD');
  const [direction, setDirection] = useState('Long');
  const [bias, setBias] = useState('');
  const [setupId, setSetupId] = useState('');
  const [confidence, setConfidence] = useState('');
  const [session, setSession] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [rrRatio, setRrRatio] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  const [status, setStatus] = useState('Running');
  const [profitAmount, setProfitAmount] = useState('');
  const [imageUrlBefore, setImageUrlBefore] = useState('');
  const [preTradeNote, setPreTradeNote] = useState('');
  const [executionNote, setExecutionNote] = useState('');
  const [mistakeNote, setMistakeNote] = useState('');
  const [lessonNote, setLessonNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/accounts'),
      api.get('/setups')
    ]).then(([accountsRes, setupsRes]) => {
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) setAccountId(accountsRes.data[0].id);
      setSetupsList(setupsRes.data);
      if (setupsRes.data.length > 0) setSetupId(setupsRes.data[0].id);
    });
  }, []);

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      setImageUrlBefore(`${backendUrl}${response.data.url}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploadingThumb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/trades', {
        accountId,
        tradeDate,
        tradeTime,
        pair,
        direction,
        bias,
        setupId,
        confidence,
        session,
        entryPrice: parseFloat(entryPrice),
        status,
        profitAmount: profitAmount ? parseFloat(profitAmount) : null,
        lotSize: lotSize ? parseFloat(lotSize) : null,
        rrRatio: rrRatio ? parseFloat(rrRatio) : null,
        riskAmount: riskAmount ? parseFloat(riskAmount) : null,
        imageUrlBefore,
        preTradeNote,
        executionNote,
        mistakeNote,
        lessonNote,
      });
      toast({ title: "Success", description: "Trade added successfully" });
      navigate('/trades');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding trade",
        description: error.response?.data?.message || "Failed to add trade",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/trades')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trades
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Trade</h2>
          <p className="text-muted-foreground">Log your execution details and document your thoughts.</p>
        </div>
      </div>
      
      <form onSubmit={handleCreateTrade}>
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left side: Execution Details */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-white/40">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Briefcase className="w-5 h-5" /> General
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Account</Label>
                  <Select value={accountId} onValueChange={setAccountId} required>
                    <SelectTrigger className="bg-muted/30 border-gray-200">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Date</Label>
                    <Input type="date" required value={tradeDate} onChange={(e: any) => setTradeDate(e.target.value)} className="bg-muted/30 border-gray-200" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Time</Label>
                    <Input type="time" required value={tradeTime} onChange={(e: any) => setTradeTime(e.target.value)} className="bg-muted/30 border-gray-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold">Symbol</Label>
                    <Input placeholder="EURUSD" required value={pair} onChange={(e: any) => setPair(e.target.value)} className="bg-muted/30 border-gray-200 font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold">Session</Label>
                    <Select value={session} onValueChange={setSession}>
                      <SelectTrigger className="bg-muted/30 border-gray-200"><SelectValue placeholder="Session" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asian">Asian</SelectItem>
                        <SelectItem value="London">London</SelectItem>
                        <SelectItem value="NY">NY</SelectItem>
                        <SelectItem value="Sydney">Sydney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-white/40">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Activity className="w-5 h-5" /> Strategy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Direction</Label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger className="bg-muted/30 border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long"><span className="text-blue-600 font-bold">Long</span></SelectItem>
                      <SelectItem value="Short"><span className="text-orange-600 font-bold">Short</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Bias</Label>
                  <Select value={bias} onValueChange={setBias}>
                    <SelectTrigger className="bg-muted/30 border-gray-200"><SelectValue placeholder="Bias" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bullish">Bullish</SelectItem>
                      <SelectItem value="Bearish">Bearish</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Setup</Label>
                  <Select value={setupId} onValueChange={setSetupId}>
                    <SelectTrigger className="bg-muted/30 border-gray-200"><SelectValue placeholder="Setup" /></SelectTrigger>
                    <SelectContent>
                      {setupsList.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      {setupsList.length === 0 && <SelectItem value="none" disabled>No setups found</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Confidence</Label>
                  <Select value={confidence} onValueChange={setConfidence}>
                    <SelectTrigger className="bg-muted/30 border-gray-200"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-white/40">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" /> Risk & Result
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold flex items-center gap-1"><Crosshair className="w-3 h-3"/> Entry</Label>
                  <Input type="number" step="0.00001" required value={entryPrice} onChange={(e: any) => setEntryPrice(e.target.value)} className="bg-muted/30 border-gray-200" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Lot Size</Label>
                  <Input type="number" step="0.01" value={lotSize} onChange={(e: any) => setLotSize(e.target.value)} className="bg-muted/30 border-gray-200" />
                </div>

                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Risk Amount ($)</Label>
                  <Input type="number" step="0.01" value={riskAmount} onChange={(e: any) => setRiskAmount(e.target.value)} className="bg-muted/30 border-gray-200" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">R:R</Label>
                  <Input type="number" step="0.01" placeholder="e.g. 2.5" value={rrRatio} onChange={(e: any) => setRrRatio(e.target.value)} className="bg-muted/30 border-gray-200" />
                </div>

                <div className="grid gap-2 col-span-2 pt-2 border-t border-gray-100">
                  <Label className="text-muted-foreground font-semibold">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={`border-gray-200 font-bold ${status === 'Win' ? 'bg-green-50 text-green-700' : status === 'Loss' ? 'bg-red-50 text-red-700' : status === 'Breakeven' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Running">Running</SelectItem>
                      <SelectItem value="Win">Win</SelectItem>
                      <SelectItem value="Loss">Loss</SelectItem>
                      <SelectItem value="Breakeven">Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2 col-span-2">
                  <Label className="text-muted-foreground font-semibold flex items-center gap-1"><DollarSign className="w-3 h-3"/> Profit/Loss ($)</Label>
                  <Input type="number" step="0.01" value={profitAmount} onChange={(e: any) => setProfitAmount(e.target.value)} className={`font-bold text-lg border-gray-200 ${profitAmount && parseFloat(profitAmount) >= 0 ? 'bg-green-50 text-green-700' : profitAmount && parseFloat(profitAmount) < 0 ? 'bg-red-50 text-red-700' : 'bg-muted/30'}`} />
                </div>
                
                <div className="grid gap-2 col-span-2 pt-2 border-t border-gray-100">
                  <Label className="text-muted-foreground font-semibold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Chart Image</Label>
                  <div className="flex space-x-2">
                    <Input placeholder="https://..." value={imageUrlBefore} onChange={(e: any) => setImageUrlBefore(e.target.value)} className="bg-muted/30 border-gray-200" />
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleThumbnailUpload} className="hidden" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingThumb} className="bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary">
                      {uploadingThumb ? <span className="animate-spin text-muted-foreground">↻</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-lg shadow-lg shadow-primary/30" disabled={loading} size="lg">
              {loading ? 'Saving Trade...' : 'Save Trade'}
            </Button>
          </div>

          {/* Right side: Journaling Notepad */}
          <div className="col-span-12 lg:col-span-8 flex flex-col bg-white p-6 rounded-lg border shadow-sm lg:sticky lg:top-4 h-[800px]">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4 shrink-0">Trading Notepad</h3>
            <div className="flex-1 rounded-md p-2 flex flex-col min-h-0 overflow-hidden">
              <Tabs defaultValue="pretrade" className="w-full h-full flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 mb-4 shrink-0">
                  <TabsTrigger value="pretrade">Trade Reason</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                  <TabsTrigger value="mistake">Mistakes</TabsTrigger>
                  <TabsTrigger value="lesson">Lessons</TabsTrigger>
                </TabsList>
                <TabsContent value="pretrade" className="m-0 h-full data-[state=active]:flex flex-col min-h-0 overflow-hidden">
                  <JournalEditor content={preTradeNote} onChange={setPreTradeNote} />
                </TabsContent>
                <TabsContent value="execution" className="m-0 h-full data-[state=active]:flex flex-col min-h-0 overflow-hidden">
                  <JournalEditor content={executionNote} onChange={setExecutionNote} />
                </TabsContent>
                <TabsContent value="mistake" className="m-0 h-full data-[state=active]:flex flex-col min-h-0 overflow-hidden">
                  <JournalEditor content={mistakeNote} onChange={setMistakeNote} />
                </TabsContent>
                <TabsContent value="lesson" className="m-0 h-full data-[state=active]:flex flex-col min-h-0 overflow-hidden">
                  <JournalEditor content={lessonNote} onChange={setLessonNote} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
