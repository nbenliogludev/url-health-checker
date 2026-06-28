import type { FormEvent } from 'react'
import { LoaderCircle, Play } from 'lucide-react'

type CreateJobFormProps = {
  urlInput: string
  urlsCount: number
  createError: string | null
  createdJobId: string | null
  isCreatingJob: boolean
  canCreateJob: boolean
  onUrlInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateJobForm({
  urlInput,
  urlsCount,
  createError,
  createdJobId,
  isCreatingJob,
  canCreateJob,
  onUrlInputChange,
  onSubmit,
}: CreateJobFormProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">New job</h2>
        {urlsCount > 0 && (
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
            {urlsCount} unique URL{urlsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <form id="create-job-form" className="space-y-4 p-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-zinc-700" htmlFor="urls">
          URLs to check
        </label>
        <textarea
          id="urls"
          rows={12}
          value={urlInput}
          onChange={(event) => onUrlInputChange(event.target.value)}
          className="w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 min-h-[200px]"
          placeholder={'https://example.com\nhttps://github.com'}
        />
        {createError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {createError}
          </p>
        ) : null}
        {createdJobId ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Created job <span className="font-mono">{createdJobId}</span>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!canCreateJob}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isCreatingJob ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Play size={17} />
          )}
          {isCreatingJob ? 'Creating job' : 'Start job'}
        </button>
      </form>
    </section>
  )
}
