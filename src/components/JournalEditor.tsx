import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageResize from 'tiptap-extension-resize-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Strikethrough, Heading2, List, ListOrdered, Code, Quote, Undo, Redo, Table as TableIcon, PaintBucket, ImageIcon, Loader2, Mic, Square } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import api from '@/services/api'

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Try Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "bn-BD"
    recognition.continuous = true
    recognition.interimResults = false // only insert final results to avoid duplicating text

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }
      if (finalTranscript.trim() && editor) {
        editor.chain().focus().insertContent(finalTranscript).run()
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (err) {
      console.error("Speech recognition start error", err)
    }
  }

  if (!editor) {
    return null
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use full backend URL or the configured api instance
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const imageUrl = `${backendUrl}${response.data.url}`;
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Image upload failed', error);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50 rounded-t-md relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-secondary' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-secondary' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-secondary' : ''}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1 my-auto" />
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-secondary' : ''}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-secondary' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-secondary' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      {/* Table Support */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="h-4 w-4" />
      </Button>

      {/* Image Upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </Button>

      {/* Voice to Text */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleRecording}
        className={isRecording ? 'bg-red-100 text-red-600 animate-pulse hover:bg-red-200' : ''}
        title="Voice to Text (Banglish)"
      >
        {isRecording ? <Square className="h-4 w-4" fill="currentColor" /> : <Mic className="h-4 w-4" />}
      </Button>

      {/* Color Support */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setColor('#ef4444').run()} // Red color
        className={editor.isActive('textStyle', { color: '#ef4444' }) ? 'bg-secondary text-red-500' : 'text-red-500'}
      >
        <PaintBucket className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setColor('#22c55e').run()} // Green color
        className={editor.isActive('textStyle', { color: '#22c55e' }) ? 'bg-secondary text-green-500' : 'text-green-500'}
      >
        <PaintBucket className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().unsetColor().run()}
      >
        <PaintBucket className="h-4 w-4 text-muted-foreground" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'bg-secondary' : ''}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-secondary' : ''}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <div className="flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function JournalEditor({ content, onChange }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageResize,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="border rounded-md bg-background flex flex-col h-full min-h-0">
      <MenuBar editor={editor} />
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
