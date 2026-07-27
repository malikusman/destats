import { Link, useParams } from 'react-router-dom';
import { Clock, Link2, Package, Server } from 'lucide-react';
import { IncidentPlatformPanels } from '../components/IncidentPlatformPanels';
import {
  useIncidentAssets,
  useIncidentDetail,
  useIncidentRecommendations,
  useIncidentTimeline,
  useRelatedIncidents,
} from '../hooks/incident-service';
import { formatTimestamp } from '../lib/format';
import { SEVERITY_BG, severityTone, statusBadgeClass } from '../lib/incident-display';

export function IncidentOverviewApi() {
  const { id } = useParams<{ id: string }>();
  const detail = useIncidentDetail(id);
  const timeline = useIncidentTimeline(id);
  const related = useRelatedIncidents(id);
  const recommendations = useIncidentRecommendations(id);
  const assets = useIncidentAssets(id);

  const isLoading = detail.isLoading || timeline.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return null;
  }

  const incident = detail.data;
  const events = timeline.data ?? [];
  const relatedList = related.data ?? [];
  const recs = recommendations.data ?? [];
  const incidentAssets = assets.data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Server className="h-4 w-4 text-slate-400" />
          Affected Entity
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm font-medium text-slate-700">{incident.entity}</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
              {incident.asset_type}
            </span>
          </div>
          {incident.related_alert_ids.map((alertId) => (
            <span
              key={alertId}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-500"
            >
              {alertId}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-slate-400">{incident.correlation_key}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Package className="h-4 w-4 text-slate-400" />
          Linked Assets
        </div>
        {assets.isLoading ? (
          <p className="text-sm text-slate-400">Loading assets…</p>
        ) : assets.isError ? (
          <p className="text-sm text-amber-700">
            Assets endpoint is currently unavailable.
          </p>
        ) : incidentAssets.length === 0 ? (
          <p className="text-sm text-slate-400">
            No assets returned for this incident.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {incidentAssets.map((asset, index) => (
              <span
                key={`${asset.asset_id ?? asset.name ?? index}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                {asset.name ?? asset.asset_id ?? `Asset ${index + 1}`}
                {asset.type ? ` (${asset.type})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          Incident Timeline
        </div>
        {timeline.isError ? (
          <p className="text-sm text-amber-700">Timeline endpoint is currently unavailable.</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-400">No timeline events returned for this incident.</p>
        ) : (
          <ol className="relative border-l border-slate-200 pl-6">
            {events.map((event, i) => (
              <li key={`${event.timestamp}-${i}`} className={i < events.length - 1 ? 'mb-5' : ''}>
                <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
                <span className="text-xs text-slate-400">{formatTimestamp(event.timestamp)}</span>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{event.event}</p>
                {event.details && (
                  <p className="mt-0.5 text-xs text-slate-500">{event.details}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link2 className="h-4 w-4 text-slate-400" />
          Related Incidents
        </div>
        {related.isError ? (
          <p className="text-sm text-amber-700">Related incidents are currently unavailable.</p>
        ) : relatedList.length === 0 ? (
          <p className="text-sm text-slate-400">No related incidents found.</p>
        ) : (
          <div className="space-y-2">
            {relatedList.map((rel) => {
              const tone = severityTone(rel.severity);
              return (
                <Link
                  key={rel.incident_id}
                  to={`/incidents/${rel.incident_id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-blue-300"
                >
                  <span className="text-sm font-medium text-slate-800">{rel.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${SEVERITY_BG[tone]}`}
                  >
                    {rel.severity}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusBadgeClass(rel.status)}`}
                  >
                    {rel.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {id && (
        <IncidentPlatformPanels
          incidentId={id}
          title={incident.title}
          description={incident.description}
          recommendations={recs}
          recommendationsUnavailable={recommendations.isError}
        />
      )}
    </div>
  );
}
