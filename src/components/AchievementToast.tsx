import { Sparkles, Trophy, X } from "lucide-react";

interface AchievementToastProps {
  title: string;
  description: string;
  visible: boolean;
  onClose: () => void;
}

export function AchievementToast({
  title,
  description,
  visible,
  onClose
}: AchievementToastProps) {
  if (!visible) return null;

  return (
    <div className="achievement-toast" role="status">
      <div className="achievement-rays">
        <Sparkles size={20} />
      </div>
      <div className="achievement-trophy">
        <Trophy size={24} />
      </div>
      <div>
        <span>ACHIEVEMENT UNLOCKED</span>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="閉じる">
        <X size={15} />
      </button>
    </div>
  );
}
