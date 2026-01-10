"use client";

import React, { useState, useEffect } from "react";
import { DamageRecord } from "@/types/damage.types";
import Button from "@/components/shared ui/Button";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Load from "@/components/Load";
import { FiEye, FiAlertTriangle, FiUser, FiCalendar, FiClock } from "react-icons/fi";

interface BatchDamageDetailsProps {
  batchId: number;
  batchNumber: string;
  damageQuantity: number;
}

interface DamageResponse {
  damages: DamageRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function BatchDamageDetails({ 
  batchId, 
  batchNumber, 
  damageQuantity 
}: BatchDamageDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [damages, setDamages] = useState<DamageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDamageDetails = async () => {
    if (damageQuantity === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/damage?batchId=${batchId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch damage details');
      }
      
      const result: DamageResponse = await response.json();
      setDamages(result.damages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load damage details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDamageDetails();
    }
  }, [isOpen, batchId]);

  if (damageQuantity === 0) {
    return (
      <span className="text-gray-500 text-sm font-medium">0</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1 transition-colors"
      >
        {damageQuantity}
        <FiEye className="w-3 h-3" />
      </button>

      <CenteredModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Damage Records - Batch ${batchNumber}`}
        width="w-full max-w-3xl"
        footerButtons={
          <Button onClick={() => setIsOpen(false)} variant="secondary">
            Close
          </Button>
        }
      >
        {loading ? (
          <Load message="Loading damage records" />
        ) : error ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <FiAlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={fetchDamageDetails}
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        ) : damages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="flex justify-center mb-4">
              <FiAlertTriangle className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">No Damage Records Found</p>
            <p className="text-sm">This batch has no recorded damage incidents.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Header */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Damage Summary</h3>
                  <p className="text-sm text-red-700">
                    Total damaged quantity: <span className="font-bold">{damageQuantity} units</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Damage Records */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Damage History ({damages.length} records)
              </h4>
              
              {damages.map((damage, index) => (
                <div key={damage.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                        Record #{damages.length - index}
                      </span>
                      <span className="text-red-600 font-bold text-lg">
                        -{damage.quantity} units
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        {new Date(damage.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <FiClock className="w-3 h-3" />
                        {new Date(damage.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm font-medium">Reason:</span>
                      <p className="text-gray-900 mt-1 bg-white p-2 rounded border text-sm">
                        {damage.reason}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <FiUser className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Recorded by:</span>
                      <span className="font-medium text-gray-900">{damage.creator.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Batch Information</h4>
              <div className="text-sm text-blue-800">
                <p>Batch Number: <span className="font-medium">{batchNumber}</span></p>
                <p>Total Damage Records: <span className="font-medium">{damages.length}</span></p>
                <p>Total Damaged Quantity: <span className="font-medium">{damageQuantity} units</span></p>
              </div>
            </div>
          </div>
        )}
      </CenteredModal>
    </>
  );
}