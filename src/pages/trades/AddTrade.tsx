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
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { Upload, ArrowLeft, Briefcase, Clock, Activity, Target, Crosshair, DollarSign, Image as ImageIcon, CheckSquare, ClipboardCheck } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
}

interface SetupData {
  id: string;
  name: string;
  description?: string;
  checklist?: ChecklistItem[];
}

export default function AddTrade() {
  const navigate = useNavigate();
  const { environment } = useEnvironmentStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [setupsList, setSetupsList] = useState<SetupData[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State - Common fields
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
  
  // Dynamic Checklist State
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const { toast } = useToast();

  // Get current setup's checklist
  const selectedSetup = setupsList.find(s => s.id === setupId);
  const setupChecklist: ChecklistItem[] = selectedSetup?.checklist && Array.isArray(selectedSetup.checklist)
    ? selectedSetup.checklist 
    : [];

  // Calculate checklist score
  const checklistScore = setupChecklist.filter(item => checklistState[item.id]).length;
  const checklistTotal = setupChecklist.length;

  useEffect(() => {
    Promise.all([
      api.get('/accounts'),
      api.get('/setups')
    ]).then(([accountsRes, setupsRes]) => {
      const envAccounts = accountsRes.data.filter((a: any) => (a.environment || 'Live') === environment);
      setAccounts(envAccounts);
      if (envAccounts.length > 0) setAccountId(envAccounts[0].id);
      setSetupsList(setupsRes.data);
    });
  }, [environment]);

  // Reset checklist state when setup changes
  useEffect(() => {
    setChecklistState({});
  }, [setupId]);

  const handleChecklistToggle = (itemId: string) => {
    setChecklistState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

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
        entryPrice: entryPrice ? parseFloat(entryPrice) : 0,
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
        checklistData: setupChecklist.length > 0 ? checklistState : null,
        checklistScore: setupChecklist.length > 0 ? checklistScore : null,
        checklistTotal: setupChecklist.length > 0 ? checklistTotal : null,
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
            
            <div className="bg-card/80 dark:bg-card/90 backdrop-blur-xl p-6 rounded-2xl border shadow-sm dark:shadow-none border-border">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Briefcase className="w-5 h-5" /> General
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Account</Label>
                  <Select value={accountId} onValueChange={setAccountId} required>
                    <SelectTrigger className="bg-muted/30 border-border">
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
                    <Input type="date" required value={tradeDate} onChange={(e: any) => setTradeDate(e.target.value)} className="bg-muted/30 border-border" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Time</Label>
                    <Input type="time" required value={tradeTime} onChange={(e: any) => setTradeTime(e.target.value)} className="bg-muted/30 border-border" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold">Symbol</Label>
                    <Input placeholder="EURUSD" required value={pair} onChange={(e: any) => setPair(e.target.value)} className="bg-muted/30 border-border font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground font-semibold">Session</Label>
                    <Select value={session} onValueChange={setSession}>
                      <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Session" /></SelectTrigger>
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

            <div className="bg-card/80 dark:bg-card/90 backdrop-blur-xl p-6 rounded-2xl border shadow-sm dark:shadow-none border-border">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Activity className="w-5 h-5" /> Strategy
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Direction</Label>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long"><span className="text-blue-600 font-bold">Long</span></SelectItem>
                      <SelectItem value="Short"><span className="text-orange-600 font-bold">Short</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Bias</Label>
                  <Select value={bias} onValueChange={setBias}>
                    <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Bias" /></SelectTrigger>
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
                    <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Setup" /></SelectTrigger>
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
                    <SelectTrigger className="bg-muted/30 border-border"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card/80 dark:bg-card/90 backdrop-blur-xl p-6 rounded-2xl border shadow-sm dark:shadow-none border-border">
              <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" /> Risk & Result
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">Risk Amount ({accounts.find(a => a.id === accountId)?.currency === 'BDT' ? 'BDT' : '$'})</Label>
                  <Input type="number" step="0.01" value={riskAmount} onChange={(e: any) => setRiskAmount(e.target.value)} className="bg-muted/30 border-border" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground font-semibold">R:R</Label>
                  <Input type="number" step="0.01" placeholder="e.g. 2.5" value={rrRatio} onChange={(e: any) => setRrRatio(e.target.value)} className="bg-muted/30 border-border" />
                </div>

                <div className="grid gap-2 col-span-2 pt-2 border-t border-border">
                  <Label className="text-muted-foreground font-semibold">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={`border-border font-bold ${status === 'Win' ? 'bg-green-50 text-green-700' : status === 'Loss' ? 'bg-red-50 text-red-700' : status === 'Breakeven' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
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
                

                
                <div className="grid gap-2 col-span-2 pt-2 border-t border-border">
                  <Label className="text-muted-foreground font-semibold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Chart Image</Label>
                  <div className="flex space-x-2">
                    <Input placeholder="https://..." value={imageUrlBefore} onChange={(e: any) => setImageUrlBefore(e.target.value)} className="bg-muted/30 border-border" />
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleThumbnailUpload} className="hidden" />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingThumb} className="bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary">
                      {uploadingThumb ? <span className="animate-spin text-muted-foreground">↻</span> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Setup Checklist */}
            {setupChecklist.length > 0 && (
              <div className="bg-card/80 dark:bg-card/90 backdrop-blur-xl p-6 rounded-2xl border shadow-sm dark:shadow-none border-border">
                <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2 text-primary justify-between">
                  <span className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> Setup Checklist</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                    checklistScore === checklistTotal 
                      ? 'bg-green-100 text-green-700' 
                      : checklistScore > 0 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {checklistScore} / {checklistTotal}
                  </span>
                </h3>
                
                <div className="space-y-2">
                  {setupChecklist.map((item) => {
                    const isChecked = !!checklistState[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-green-50/80 border-green-200 shadow-sm'
                            : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-border'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-border bg-card'
                        }`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => handleChecklistToggle(item.id)}
                        />
                        <span className={`text-sm font-medium ${isChecked ? 'text-green-800' : 'text-foreground/80'}`}>
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        checklistScore === checklistTotal ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${checklistTotal > 0 ? (checklistScore / checklistTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    {checklistScore === checklistTotal && checklistTotal > 0 
                      ? '✅ All checklist items verified!' 
                      : `${checklistTotal - checklistScore} items remaining`
                    }
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full text-lg shadow-lg shadow-primary/30" disabled={loading} size="lg">
              {loading ? 'Saving Trade...' : 'Save Trade'}
            </Button>
          </div>

          {/* Right side: Journaling Notepad */}
          <div className="col-span-12 lg:col-span-8 flex flex-col bg-card p-6 rounded-lg border shadow-sm lg:sticky lg:top-4 h-[800px]">
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
