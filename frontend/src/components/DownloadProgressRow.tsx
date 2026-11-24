import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { tr } from '../i18n';
import type { DownloadProgressState, Lang } from '../types';

interface DownloadProgressRowProps {
  lang: Lang;
  progress: DownloadProgressState;
}

export function DownloadProgressRow({ lang, progress }: DownloadProgressRowProps) {
  const phaseLabelMap: Record<DownloadProgressState['phase'], string> = {
    downloading: tr(lang, 'phaseDownloading'),
    fallback: tr(lang, 'phaseFallback'),
    verifying: tr(lang, 'phaseVerifying'),
    permission_required: tr(lang, 'phasePermission'),
    uninstalling_old: tr(lang, 'phaseUninstalling'),
    installing: tr(lang, 'phaseInstalling'),
    done: tr(lang, 'statusInstalled'),
    error: 'Error',
  };

  const label = phaseLabelMap[progress.phase] || tr(lang, 'phaseDownloading');
  const indeterminate = progress.phase === 'downloading' && progress.totalBytes <= 0;
  const variant =
    progress.phase === 'permission_required' || progress.phase === 'uninstalling_old'
      ? 'warning'
      : progress.phase === 'installing' || progress.phase === 'done'
        ? 'success'
        : 'accent';

  return (
    <ProgressBar
      label={label}
      value={progress.percent}
      max={100}
      hasValueLabel={!indeterminate}
      isIndeterminate={indeterminate}
      variant={variant}
    />
  );
}
