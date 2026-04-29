import { Component, ChangeDetectionStrategy, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientData } from './patient-data.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class AppComponent implements OnInit {
  
  private readonly residentInitials = [
    'JG', 'MP', 'LS', 'CR', 'AV', 'RM', 'EP', 'FV', 'GL', 'SO', 'DP', 'BC', 'NV', 'MT'
  ];
  private allPatientData: PatientData[] = [];
  private currentResidentIndex = 0;

  readonly rooms = [
    'Sala de Estar', 'Comedor', 'Cocina', 'Jardín',
    'Baño 1', 'Baño 2', 'Baño 3', 'Baño 4',
    ...Array.from({ length: 14 }, (_, i) => `Habitación ${i + 1}`)
  ];

  patientData = signal<PatientData>({
    patientId: '',
    lastMovementTimestamp: new Date().toISOString(),
    currentRoom: '',
    isMoving: false,
    activityLevel: 'none',
    fallDetected: false,
    dailyStepCount: 0,
    movementHistory: [],
    wristbandStatus: 'disconnected',
    wristbandBatteryLevel: 0,
    medicalConditions: [],
    dailySchedule: []
  });

  roomLights = signal<{[key: string]: number}>({});
  selectedRoom = signal<string>('');
  
  lightLevel = computed(() => this.roomLights()[this.selectedRoom()] ?? 0);
  
  constructor() {
    effect(() => {
      // Si el residente se está moviendo, encender la luz de su habitación automáticamente.
      const patient = this.patientData();
      if (patient.isMoving && patient.currentRoom) {
        this.roomLights.update(lights => {
          const newLights = {...lights};
          newLights[patient.currentRoom] = 85;
          return newLights;
        });
      }
    });
  }

  ngOnInit() {
    // Inicializar las luces de todas las habitaciones
    const initialLights: {[key: string]: number} = {};
    this.rooms.forEach(room => {
      initialLights[room] = Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 20 : 0; // Algunas encendidas
    });
    this.roomLights.set(initialLights);

    this.allPatientData = this.residentInitials.map(initials => this._createMockPatientData(initials));
    this.patientData.set(this.allPatientData[0]);
    this.selectedRoom.set(this.allPatientData[0].currentRoom);


    setInterval(() => {
      this.currentResidentIndex = (this.currentResidentIndex + 1) % this.allPatientData.length;
      const nextPatientData = this.allPatientData[this.currentResidentIndex];
      // Simulate real-time data change
      nextPatientData.lastMovementTimestamp = new Date().toISOString();
      nextPatientData.isMoving = Math.random() > 0.5;
      nextPatientData.dailyStepCount = Math.floor(nextPatientData.dailyStepCount * (1 + (Math.random() - 0.4) * 0.05));
      this.patientData.set(nextPatientData);
    }, 5000); // Cambia de residente cada 5 segundos
  }

  lastSeen = computed(() => {
    const date = new Date(this.patientData().lastMovementTimestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  });

  dailyStepGoal = 1500;
  stepProgress = computed(() => {
    return Math.min(100, (this.patientData().dailyStepCount / this.dailyStepGoal) * 100);
  });
  
  isLightOn = computed(() => this.lightLevel() > 10);

  wristbandStatusText = computed(() => {
    switch (this.patientData().wristbandStatus) {
      case 'connected':
        return 'Conectada';
      case 'disconnected':
        return 'Desconectada';
      case 'low_battery':
        return 'Batería Baja';
      default:
        return 'Desconocido';
    }
  });

  wristbandStatusColorClass = computed(() => {
    switch (this.patientData().wristbandStatus) {
      case 'connected':
        return 'text-green-400';
      case 'disconnected':
        return 'text-red-500';
      case 'low_battery':
        return 'text-yellow-400';
      default:
        return 'text-slate-500';
    }
  });
  
  wristbandStatusBgColorClass = computed(() => {
    switch (this.patientData().wristbandStatus) {
      case 'connected':
        return 'bg-green-400';
      case 'disconnected':
        return 'bg-red-500';
      case 'low_battery':
        return 'bg-yellow-400';
      default:
        return 'bg-slate-500';
    }
  });

  batteryColorClass = computed(() => {
    if (this.patientData().wristbandStatus === 'disconnected') {
      return 'text-slate-500';
    }
    const level = this.patientData().wristbandBatteryLevel;
    if (level > 50) return 'text-green-400';
    if (level > 20) return 'text-yellow-400';
    return 'text-red-500';
  });

  updateLightLevel(event: Event) {
    const target = event.target as HTMLInputElement;
    const level = Number(target.value);
    const room = this.selectedRoom();
    this.roomLights.update(lights => ({ ...lights, [room]: level }));
  }

  toggleLight() {
    const room = this.selectedRoom();
    const newLevel = this.isLightOn() ? 0 : 100;
    this.roomLights.update(lights => ({ ...lights, [room]: newLevel }));
  }

  setNightLight() {
    const room = this.selectedRoom();
    this.roomLights.update(lights => ({ ...lights, [room]: 15 }));
  }

  getActivityBarClass(level: 'normal' | 'low' | 'none'): string {
    switch (level) {
      case 'normal':
        return 'bg-purple-500';
      case 'low':
        return 'bg-indigo-500';
      case 'none':
        return 'bg-slate-600';
      default:
        return 'bg-slate-700';
    }
  }

  getActivityBarHeight(level: 'normal' | 'low' | 'none'): number {
    switch (level) {
      case 'normal':
        return 100;
      case 'low':
        return 50;
      case 'none':
        return 10;
      default:
        return 0;
    }
  }

  private _createMockPatientData(patientId: string): PatientData {
    const currentRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
    const activityLevels: ('normal' | 'low' | 'none')[] = ['normal', 'low', 'none'];
    const fallDetected = Math.random() > 0.98; // Very low chance of fall
    
    const batteryLevel = Math.floor(Math.random() * 91) + 10; // 10-100%
    let wristbandStatus: 'connected' | 'disconnected' | 'low_battery' = 'connected';
    if (batteryLevel < 20) {
      wristbandStatus = 'low_battery';
    }
    if (Math.random() > 0.95) { // 5% chance of being disconnected
      wristbandStatus = 'disconnected';
    }
    
    const allConditions = ['Hipertensión', 'Diabetes', 'Artrosis', 'Osteoporosis', 'Alzheimer', 'EPOC', 'Insuf. Cardíaca'];
    const numConditions = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const medicalConditions = [...allConditions].sort(() => 0.5 - Math.random()).slice(0, numConditions);

    const dailySchedule = [
      { time: '08:00', activity: 'Desayuno y Medicación' },
      { time: '10:00', activity: 'Terapia Física' },
      { time: '11:30', activity: 'Taller de Memoria' },
      { time: '13:30', activity: 'Almuerzo' },
      { time: '15:00', activity: 'Descanso / Siesta' },
      { time: '16:30', activity: 'Actividad Social' },
      { time: '19:00', activity: 'Cena' },
      { time: '21:00', activity: 'Medicación Nocturna' },
    ];

    return {
      patientId,
      lastMovementTimestamp: new Date(Date.now() - Math.random() * 600000).toISOString(),
      currentRoom,
      isMoving: Math.random() > 0.5,
      activityLevel: activityLevels[Math.floor(Math.random() * 2)], // more likely to be normal or low
      fallDetected,
      fallLocation: fallDetected ? currentRoom : undefined,
      dailyStepCount: Math.floor(Math.random() * 801) + 500, // Range: 500-1300
      movementHistory: Array.from({ length: 24 }, () => activityLevels[Math.floor(Math.random() * activityLevels.length)]),
      wristbandStatus,
      wristbandBatteryLevel: batteryLevel,
      medicalConditions,
      dailySchedule
    };
  }
}