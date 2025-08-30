import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Shield, FileText, MapPin, Car, Home, Users, Loader2, AlertCircle, Tag } from 'lucide-react'

const Row = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-3 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="col-span-2">{value ?? '—'}</span>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">{children}</CardContent>
  </Card>
);

export default function DataDisplay({ extractedData, loading, error }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Extracting structured data from your document…</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Extraction Failed</h3>
        <p className="text-red-600 text-center">{error}</p>
      </div>
    )
  }

  if (!extractedData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Shield className="w-8 h-8 mb-4" />
        <p>Upload a document to see extracted data here</p>
      </div>
    )
  }

  const d = extractedData || {}

  return (
    <div className="space-y-6">
      <Section icon={FileText} title="Document Summary">
        <div className="flex flex-wrap gap-2">
          {d.document_kind && <Badge variant="secondary">{d.document_kind.replaceAll('_', ' ')}</Badge>}
          {d.policy?.type && <Badge variant="outline">{d.policy.type}</Badge>}
        </div>
        <Separator className="my-2" />
        <div className="space-y-2">
          <Row label="Policy Number" value={d.policy?.number} />
          <Row label="Effective" value={d.policy?.effective_date} />
          <Row label="Expiration" value={d.policy?.expiration_date} />
          <Row label="Insurer" value={d.policy?.insurer?.name} />
          <Row label="Producer" value={d.policy?.producer?.agency_name} />
          <Row label="Total Premium" value={d.policy?.premium_summary?.total_premium} />
        </div>
      </Section>

      {Array.isArray(d.insureds) && d.insureds.length > 0 && (
        <Section icon={Users} title="Named Insured(s)">
          <div className="space-y-3">
            {d.insureds.map((p, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="font-medium">{p.name || `Insured ${i + 1}`}</div>
                {p.mailing_address && (
                  <div className="text-sm text-gray-600">{p.mailing_address}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(d.locations) && d.locations.length > 0 && (
        <Section icon={MapPin} title="Locations / Garaging">
          <div className="space-y-2">
            {d.locations.map((loc, i) => (
              <div key={i} className="text-sm">{loc.address}</div>
            ))}
          </div>
        </Section>
      )}

      {Array.isArray(d.coverages) && d.coverages.length > 0 && (
        <Section icon={Tag} title="Coverages">
          <div className="space-y-3">
            {d.coverages.map((c, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{c.name || `Coverage ${i + 1}`}</div>
                  {c.premium && <Badge variant="secondary">Premium: {String(c.premium)}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div><span className="text-gray-500">Limit:</span> {c.limit ?? '—'}</div>
                  <div><span className="text-gray-500">Aggregate:</span> {c.aggregate ?? '—'}</div>
                  <div><span className="text-gray-500">Deductible:</span> {c.deductible ?? '—'}</div>
                </div>
                {c.notes && <div className="text-sm text-gray-600 mt-2">{c.notes}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.homeowners && (
        <Section icon={Home} title="Homeowners Details">
          <div className="grid grid-cols-1 gap-2">
            <Row label="Coverage A – Dwelling" value={d.homeowners.dwelling_coverage_a} />
            <Row label="Coverage B – Other Structures" value={d.homeowners.other_structures_coverage_b} />
            <Row label="Coverage C – Personal Property" value={d.homeowners.personal_property_coverage_c} />
            <Row label="Coverage D – Loss of Use" value={d.homeowners.loss_of_use_coverage_d} />
            <Row label="Coverage E – Liability" value={d.homeowners.liability_coverage_e} />
            <Row label="Coverage F – Medical Payments" value={d.homeowners.medical_payments_coverage_f} />
            <Row label="Wind/Hurricane Deductible" value={d.homeowners.wind_or_hurricane_deductible} />
          </div>
          {Array.isArray(d.homeowners.endorsements) && d.homeowners.endorsements.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex flex-wrap gap-2">
                {d.homeowners.endorsements.map((e, i) => <Badge key={i} variant="outline">{e}</Badge>)}
              </div>
            </>
          )}
        </Section>
      )}

      {(d.auto?.vehicles?.length || d.auto?.drivers?.length) ? (
        <Section icon={Car} title="Auto Details">
          {Array.isArray(d.auto?.vehicles) && d.auto.vehicles.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium">Vehicles</div>
              {d.auto.vehicles.map((v, i) => (
                <div key={i} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium">{[v.year, v.make, v.model].filter(Boolean).join(' ') || `Vehicle ${i + 1}`}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div><span className="text-gray-500">VIN:</span> {v.vin ?? '—'}</div>
                    <div><span className="text-gray-500">Garaging:</span> {v.garaging_address ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(d.auto?.drivers) && d.auto.drivers.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="font-medium">Drivers</div>
              {d.auto.drivers.map((dr, i) => (
                <div key={i} className="text-sm">{dr.name}{dr.date_of_birth ? ` — DOB: ${dr.date_of_birth}` : ''}</div>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {Array.isArray(d.deductibles) && d.deductibles.length > 0 && (
        <Section icon={Shield} title="Deductibles">
          <div className="grid grid-cols-1 gap-2">
            {d.deductibles.map((dd, i) => (
              <div key={i} className="text-sm">
                <span className="text-gray-500">{dd.type || 'Deductible'}:</span> {dd.amount ?? '—'}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
