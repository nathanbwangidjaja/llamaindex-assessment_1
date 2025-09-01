import React from 'react'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

function KV({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-2 text-sm">
      <div className="w-40 shrink-0 text-gray-500">{label}</div>
      <div className="text-gray-900 whitespace-pre-wrap">{String(value)}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-4 md:p-5 bg-white/70">
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Table({ columns, rows, emptyText = 'No data' }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-gray-500">{emptyText}</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4 font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-4 whitespace-pre-wrap">
                  {r?.[c.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DataDisplay({ extractedData, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <Loader2 className="w-4 h-4 animate-spin" />
        Processing document…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Error</span>
        </div>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    )
  }

  if (!extractedData) {
    return (
      <div className="text-sm text-gray-500">
        Upload a document to see structured results here.
      </div>
    )
  }

  // shape guards
  const {
    document_kind,
    source,
    policy,
    insureds = [],
    locations = [],
    coverages = [],
    deductibles = [],
    homeowners,
    auto,
    certificate,
  } = extractedData

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-green-700">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Extraction complete</span>
      </div>

      {/* Document basics */}
      <Section title="Document">
        <div className="space-y-2">
          <KV label="Type" value={document_kind} />
          {source && (
            <>
              <KV label="File name" value={source.file_name} />
              <KV label="Pages" value={source.pages} />
            </>
          )}
        </div>
      </Section>

      {/* Policy */}
      {policy && (
        <Section title="Policy">
          <div className="grid md:grid-cols-2 gap-3">
            <KV label="Number" value={policy.number} />
            <KV label="Type" value={policy.type} />
            <KV label="Effective" value={policy.effective_date} />
            <KV label="Expiration" value={policy.expiration_date} />
            {policy.insurer && (
              <>
                <KV label="Insurer" value={policy.insurer.name} />
                <KV label="NAIC" value={policy.insurer.naic} />
              </>
            )}
            {policy.producer && (
              <>
                <KV label="Producer (Agency)" value={policy.producer.agency_name} />
                <KV label="Producer Contact" value={policy.producer.contact_name} />
                <KV label="Producer Phone" value={policy.producer.phone} />
                <KV label="Producer Email" value={policy.producer.email} />
              </>
            )}
          </div>
          {policy.premium_summary && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Premium Summary</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <KV label="Total Premium" value={policy.premium_summary.total_premium} />
                <KV label="Fees & Taxes" value={policy.premium_summary.fees_and_taxes} />
                <KV label="Term" value={policy.premium_summary.term} />
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Insureds */}
      <Section title="Insureds">
        <Table
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'mailing_address', header: 'Mailing Address' },
          ]}
          rows={insureds}
          emptyText="No insureds found"
        />
      </Section>

      {/* Locations */}
      <Section title="Locations">
        <Table
          columns={[{ key: 'address', header: 'Address' }]}
          rows={locations}
          emptyText="No locations found"
        />
      </Section>

      {/* Coverages */}
      <Section title="Coverages">
        <Table
          columns={[
            { key: 'name', header: 'Coverage' },
            { key: 'limit', header: 'Limit' },
            { key: 'deductible', header: 'Deductible' },
            { key: 'premium', header: 'Premium' },
            { key: 'notes', header: 'Notes' },
          ]}
          rows={coverages}
          emptyText="No coverages found"
        />
      </Section>

      {/* Deductibles */}
      <Section title="Deductibles">
        <Table
          columns={[
            { key: 'type', header: 'Type' },
            { key: 'amount', header: 'Amount' },
          ]}
          rows={deductibles}
          emptyText="No deductibles listed"
        />
      </Section>

      {/* Homeowners specific */}
      {homeowners && (
        <Section title="Homeowners (HO) Details">
          <div className="grid md:grid-cols-2 gap-3">
            <KV label="Coverage A – Dwelling" value={homeowners.dwelling_coverage_a} />
            <KV label="Coverage B – Other Structures" value={homeowners.other_structures_coverage_b} />
            <KV label="Coverage C – Personal Property" value={homeowners.personal_property_coverage_c} />
            <KV label="Coverage D – Loss of Use" value={homeowners.loss_of_use_coverage_d} />
            <KV label="Coverage E – Liability" value={homeowners.liability_coverage_e} />
            <KV label="Coverage F – Medical Payments" value={homeowners.medical_payments_coverage_f} />
            <KV label="Wind/Hurricane Deductible" value={homeowners.wind_or_hurricane_deductible} />
            {Array.isArray(homeowners.endorsements) && homeowners.endorsements.length > 0 && (
              <KV label="Endorsements" value={homeowners.endorsements.join(', ')} />
            )}
          </div>

          {Array.isArray(homeowners.mortgagees) && homeowners.mortgagees.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Mortgagees</h4>
              <Table
                columns={[
                  { key: 'name', header: 'Name' },
                  { key: 'address', header: 'Address' },
                ]}
                rows={homeowners.mortgagees}
              />
            </div>
          )}
        </Section>
      )}

      {/* Auto (if present) */}
      {auto && (
        <Section title="Auto">
          <div className="mb-2 text-sm text-gray-500">Vehicles</div>
          <Table
            columns={[
              { key: 'year', header: 'Year' },
              { key: 'make', header: 'Make' },
              { key: 'model', header: 'Model' },
              { key: 'vin', header: 'VIN' },
              { key: 'garaging_address', header: 'Garaging Address' },
            ]}
            rows={auto.vehicles || []}
            emptyText="No vehicles"
          />
          <div className="mt-4 mb-2 text-sm text-gray-500">Drivers</div>
          <Table
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'date_of_birth', header: 'DOB' },
            ]}
            rows={auto.drivers || []}
            emptyText="No drivers"
          />
        </Section>
      )}

      {/* Certificate (if present) */}
      {certificate && (
        <Section title="Certificate of Insurance">
          <KV label="Certificate Holder" value={certificate.certificate_holder} />
          <div className="mt-3">
            <Table
              columns={[
                { key: 'line', header: 'Line' },
                { key: 'policy_number', header: 'Policy #' },
                { key: 'effective_date', header: 'Effective' },
                { key: 'expiration_date', header: 'Expiration' },
                { key: 'limits_text', header: 'Limits' },
              ]}
              rows={certificate.policies || []}
              emptyText="No policies listed"
            />
          </div>
        </Section>
      )}

      {/* Raw JSON (debug) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-gray-500">Show raw JSON</summary>
        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto">
{JSON.stringify(extractedData, null, 2)}
        </pre>
      </details>
    </div>
  )
}
