import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Vehicle, FuelLog, Maintenance, VehicleDocument } from '../types';

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'vehicles'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
        setVehicles(list);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'vehicles')
    );

    return unsubscribe;
  }, [user]);

  const addVehicle = async (data: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'vehicles'), {
        ...data,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vehicles');
    }
  };

  const updateOdometer = async (vehicleId: string, newOdometer: number) => {
    try {
      await updateDoc(doc(db, 'vehicles', vehicleId), { currentOdometer: newOdometer });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vehicles/${vehicleId}`);
    }
  };

  return { vehicles, loading, addVehicle, updateOdometer };
}

export function useFuelLogs(vehicleId?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FuelLog[]>([]);

  useEffect(() => {
    if (!user || !vehicleId) return;

    const q = query(
      collection(db, 'fuelLogs'), 
      where('vehicleId', '==', vehicleId),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, 
      (snapshot) => {
        setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FuelLog)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `fuelLogs/${vehicleId}`)
    );
  }, [user, vehicleId]);

  const addFuelLog = async (data: Omit<FuelLog, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'fuelLogs'), { ...data, userId: user.uid });
      // update vehicle odometer too
      await updateDoc(doc(db, 'vehicles', data.vehicleId), { currentOdometer: data.odometer });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fuelLogs');
    }
  };

  return { logs, addFuelLog };
}

export function useMaintenance(vehicleId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Maintenance[]>([]);

  useEffect(() => {
    if (!user || !vehicleId) return;

    const q = query(
      collection(db, 'maintenance'), 
      where('vehicleId', '==', vehicleId),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, 
      (snapshot) => {
        setRecords(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Maintenance)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `maintenance/${vehicleId}`)
    );
  }, [user, vehicleId]);

  const addMaintenance = async (data: Omit<Maintenance, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'maintenance'), { ...data, userId: user.uid });
      if (data.odometer) {
        await updateDoc(doc(db, 'vehicles', data.vehicleId), { currentOdometer: data.odometer });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance');
    }
  };

  return { records, addMaintenance };
}

export function useDocuments() {
  const { user } = useAuth();
  const [docsList, setDocsList] = useState<VehicleDocument[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'documents'), where('userId', '==', user.uid));

    return onSnapshot(q, 
      (snapshot) => {
        setDocsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VehicleDocument)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'documents')
    );
  }, [user]);

  const addDocument = async (data: Omit<VehicleDocument, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'documents'), { ...data, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'documents');
    }
  };

  return { docs: docsList, addDocument };
}
