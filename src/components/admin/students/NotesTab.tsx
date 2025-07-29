import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Plus, Edit, Save, X, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentNote {
  id: string;
  conteudo: string;
  tipo: 'geral' | 'comportamento' | 'saude' | 'financeiro' | 'pedagogico';
  created_at: string;
  updated_at: string;
  created_by: string;
  author: {
    nome_completo: string;
    role: string;
  };
}

interface NotesTabProps {
  studentId: string;
}

const noteTypes = {
  geral: { label: 'Geral', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  comportamento: { label: 'Comportamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  saude: { label: 'Saúde', color: 'bg-red-100 text-red-800 border-red-200' },
  financeiro: { label: 'Financeiro', color: 'bg-green-100 text-green-800 border-green-200' },
  pedagogico: { label: 'Pedagógico', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export function NotesTab({ studentId }: NotesTabProps) {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    conteudo: '',
    tipo: 'geral' as keyof typeof noteTypes,
  });
  const [editNote, setEditNote] = useState({
    conteudo: '',
    tipo: 'geral' as keyof typeof noteTypes,
  });
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          profiles!student_notes_created_by_fkey(
            nome_completo,
            role
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedNotes: StudentNote[] = data?.map(note => ({
        id: note.id,
        conteudo: note.conteudo,
        tipo: note.tipo,
        created_at: note.created_at,
        updated_at: note.updated_at,
        created_by: note.created_by,
        author: {
          nome_completo: note.profiles?.nome_completo || 'Usuário Desconhecido',
          role: note.profiles?.role || 'admin',
        },
      })) || [];

      setNotes(processedNotes);
    } catch (error) {
      console.error('Erro ao buscar observações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as observações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.conteudo.trim()) {
      toast({
        title: 'Erro',
        description: 'O conteúdo da observação é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_notes')
        .insert({
          student_id: studentId,
          conteudo: newNote.conteudo.trim(),
          tipo: newNote.tipo,
          created_by: profile?.id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Observação adicionada com sucesso',
      });

      setNewNote({ conteudo: '', tipo: 'geral' });
      setAddingNote(false);
      fetchNotes();
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a observação',
        variant: 'destructive'
      });
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNote.conteudo.trim()) {
      toast({
        title: 'Erro',
        description: 'O conteúdo da observação é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_notes')
        .update({
          conteudo: editNote.conteudo.trim(),
          tipo: editNote.tipo,
        })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Observação atualizada com sucesso',
      });

      setEditingNoteId(null);
      setEditNote({ conteudo: '', tipo: 'geral' });
      fetchNotes();
    } catch (error) {
      console.error('Erro ao atualizar observação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a observação',
        variant: 'destructive'
      });
    }
  };

  const startEditing = (note: StudentNote) => {
    setEditingNoteId(note.id);
    setEditNote({
      conteudo: note.conteudo,
      tipo: note.tipo,
    });
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditNote({ conteudo: '', tipo: 'geral' });
  };

  const cancelAdding = () => {
    setAddingNote(false);
    setNewNote({ conteudo: '', tipo: 'geral' });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      professor: 'Professor',
      funcionario: 'Funcionário',
      aluno: 'Aluno',
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Note */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Observação
            </CardTitle>
            {!addingNote && (
              <Button onClick={() => setAddingNote(true)} className="dance-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        {addingNote && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="noteType">Tipo da Observação</Label>
              <select
                id="noteType"
                value={newNote.tipo}
                onChange={(e) => setNewNote({ ...newNote, tipo: e.target.value as keyof typeof noteTypes })}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                {Object.entries(noteTypes).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="noteContent">Conteúdo</Label>
              <Textarea
                id="noteContent"
                value={newNote.conteudo}
                onChange={(e) => setNewNote({ ...newNote, conteudo: e.target.value })}
                placeholder="Digite sua observação sobre o aluno..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddNote} className="dance-gradient">
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button variant="outline" onClick={cancelAdding}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Observações ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma observação encontrada</p>
              <p className="text-sm">Adicione a primeira observação sobre este aluno</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(note.author.nome_completo)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{note.author.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">
                          {getRoleLabel(note.author.role)}
                        </p>
                      </div>
                      <Badge className={noteTypes[note.tipo].color}>
                        {noteTypes[note.tipo].label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Criado em {formatDate(note.created_at)}
                        </p>
                        {note.updated_at !== note.created_at && (
                          <p className="text-xs text-muted-foreground">
                            Editado em {formatDate(note.updated_at)}
                          </p>
                        )}
                      </div>
                      
                      {note.created_by === profile?.id && editingNoteId !== note.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`editType-${note.id}`}>Tipo da Observação</Label>
                        <select
                          id={`editType-${note.id}`}
                          value={editNote.tipo}
                          onChange={(e) => setEditNote({ ...editNote, tipo: e.target.value as keyof typeof noteTypes })}
                          className="w-full p-2 border border-border rounded-md bg-background"
                        >
                          {Object.entries(noteTypes).map(([key, type]) => (
                            <option key={key} value={key}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`editContent-${note.id}`}>Conteúdo</Label>
                        <Textarea
                          id={`editContent-${note.id}`}
                          value={editNote.conteudo}
                          onChange={(e) => setEditNote({ ...editNote, conteudo: e.target.value })}
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditNote(note.id)}
                          className="dance-gradient"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-11">
                      <p className="text-sm whitespace-pre-wrap">{note.conteudo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}