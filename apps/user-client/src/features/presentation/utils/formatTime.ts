export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}초`;
  }
  return secs === 0 ? `${mins}분` : `${mins}분 ${secs}초`;
}
