import { Coins, Copy } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export function AffiliatesSection({ affiliateCommunity, affiliateCommunityLabel, affiliateUrl, onCopyAffiliateLink }) {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Affiliates</h1>
        <p className="mt-2 text-lg text-gray-700">
          Share your real community link when you want to invite new members.
        </p>
      </div>

      {affiliateCommunity ? (
        <>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Community</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{affiliateCommunityLabel}</p>
            <p className="mt-2 text-sm text-gray-500">
              This link uses your real community route instead of seeded affiliate demo data.
            </p>
          </div>

          <div>
            <div className="flex">
              <input
                readOnly
                value={affiliateUrl}
                className="flex-1 h-12 rounded-l-md border border-gray-300 px-3 text-primary-600 font-semibold"
              />
              <button
                type="button"
                onClick={onCopyAffiliateLink}
                className="h-12 px-10 rounded-r-md border border-[#eac76a] bg-[#f0c96b] font-bold text-gray-800 inline-flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                COPY
              </button>
            </div>
          </div>

          <div className="min-h-[220px] rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
            <Coins className="w-12 h-12 text-yellow-500" />
            <p className="mt-4 text-lg text-gray-700">No referral records available.</p>
          </div>
        </>
      ) : (
        <div className="min-h-[220px] rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
          <Coins className="w-12 h-12 text-yellow-500" />
          <p className="mt-4 text-lg text-gray-700">Create a community to generate a share link.</p>
        </div>
      )}
    </Card>
  );
}
