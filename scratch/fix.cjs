const fs = require('fs');
let content = fs.readFileSync('apps/web/src/pages/repo-analyzer.tsx', 'utf8');

const startIdx = content.indexOf('export function RepoAnalyzerPage() {');
const endIdx = content.indexOf('  const handleAnalyze = async () => {');

const safeHeader = `export function RepoAnalyzerPage() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const aiQueue = useAIQueue();
  
  const [repoUrl, setRepoUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [repoFiles, setRepoFiles] = useState<Record<string, RepoFile>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Explorer states
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    "src": false,
    "src-components": false,
    "src-hooks": false,
    "src-services": false,
    "src-api": false,
    "src-db": false
  });

  // Replay walkthrough engine state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStepIndex, setReplayStepIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500); // ms

  const projectId = searchParams.get("projectId");

  // Load project repo spec if exists
  useEffect(() => {
    if (!projectId) return;
    async function loadProjectRepo() {
      const { data, error } = await supabase
        .from("projects")
        .select("description")
        .eq("id", projectId)
        .maybeSingle();
      if (error) console.warn("Failed to load project repo:", error);
    }
    loadProjectRepo();
  }, [projectId]);

  // Understand walkthrough timing loop
  useEffect(() => {
    if (!isReplaying) return;
    const interval = setInterval(() => {
      setReplayStepIndex((prev) => {
        if (prev >= UNDERSTAND_REPLAY_STEPS.length - 1) {
          setIsReplaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);
    return () => clearInterval(interval);
  }, [isReplaying, playbackSpeed]);

  const handleStartReplay = () => {
    setIsReplaying(true);
    setReplayStepIndex(0);
  };

  const handlePauseReplay = () => {
    setIsReplaying(false);
  };

  const handleStepReplay = () => {
    setIsReplaying(false);
    setReplayStepIndex((prev) => (prev >= UNDERSTAND_REPLAY_STEPS.length - 1 ? 0 : prev + 1));
  };

  const handleResetReplay = () => {
    setIsReplaying(false);
    setReplayStepIndex(-1);
  };

`;

content = content.substring(0, startIdx) + safeHeader + content.substring(endIdx);
fs.writeFileSync('apps/web/src/pages/repo-analyzer.tsx', content);
console.log('Fixed repo analyzer duplication natively!');
