// 58 Algerian wilayas with delivery zones & fees (Yalidine-style simulation)
export interface WilayaInfo {
  code: number
  name: string
  nameAr: string
  nameFr: string
  zone: number
  homeFee: number
  deskFee: number
}

export const ZONE_FEES: Record<number, { home: number; desk: number }> = {
  1: { home: 400, desk: 200 },
  2: { home: 500, desk: 250 },
  3: { home: 600, desk: 300 },
  4: { home: 800, desk: 350 },
  5: { home: 1000, desk: 400 },
}

const W: WilayaInfo[] = [
  ['01', 'Adrar', 'أدرار', 5], ['02', 'Chlef', 'الشلف', 3], ['03', 'Laghouat', 'الأغواط', 4],
  ['04', 'Oum El Bouaghi', 'أم البواقي', 4], ['05', 'Batna', 'باتنة', 4], ['06', 'Bejaia', 'بجاية', 2],
  ['07', 'Biskra', 'بسكرة', 4], ['08', 'Bechar', 'بشار', 5], ['09', 'Blida', 'البليدة', 1],
  ['10', 'Bouira', 'البويرة', 2], ['11', 'Tamanrasset', 'تمنراست', 5], ['12', 'Tebessa', 'تبسة', 4],
  ['13', 'Tlemcen', 'تلمسان', 3], ['14', 'Tiaret', 'تيارت', 3], ['15', 'Tizi Ouzou', 'تيزي وزو', 2],
  ['16', 'Alger', 'الجزائر', 1], ['17', 'Djelfa', 'الجلفة', 4], ['18', 'Jijel', 'جيجل', 2],
  ['19', 'Setif', 'سطيف', 2], ['20', 'Saida', 'سعيدة', 3], ['21', 'Skikda', 'سكيكدة', 3],
  ['22', 'Sidi Bel Abbes', 'سيدي بلعباس', 3], ['23', 'Annaba', 'عنابة', 3], ['24', 'Guelma', 'قالمة', 3],
  ['25', 'Constantine', 'قسنطينة', 3], ['26', 'Medea', 'المدية', 2], ['27', 'Mostaganem', 'مستغانم', 3],
  ['28', "M'Sila", 'المسيلة', 4], ['29', 'Mascara', 'معسكر', 3], ['30', 'Ouargla', 'ورقلة', 4],
  ['31', 'Oran', 'وهران', 2], ['32', 'El Bayadh', 'البيض', 4], ['33', 'Illizi', 'إليزي', 5],
  ['34', 'Bordj Bou Arreridj', 'برج بوعريريج', 2], ['35', 'Boumerdes', 'بومرداس', 1], ['36', 'El Tarf', 'الطارف', 3],
  ['37', 'Tindouf', 'تندوف', 5], ['38', 'Tissemsilt', 'تيسمسيلت', 3], ['39', 'El Oued', 'الوادي', 4],
  ['40', 'Khenchela', 'خنشلة', 4], ['41', 'Souk Ahras', 'سوق أهراس', 3], ['42', 'Tipaza', 'تيبازة', 1],
  ['43', 'Mila', 'ميلة', 3], ['44', 'Ain Defla', 'عين الدفلى', 2], ['45', 'Naama', 'النعامة', 4],
  ['46', 'Ain Temouchent', 'عين تموشنت', 3], ['47', 'Ghardaia', 'غرداية', 4], ['48', 'Relizane', 'غليزان', 3],
  ['49', 'Timimoun', 'تيميمون', 5], ['50', 'Bordj Badji Mokhtar', 'برج باجي مختار', 5], ['51', 'Ouled Djellal', 'أولاد جلال', 4],
  ['52', 'Beni Abbes', 'بني عباس', 5], ['53', 'In Salah', 'عين صالح', 5], ['54', 'In Guezzam', 'عين قزام', 5],
  ['55', 'Touggourt', 'تقرت', 4], ['56', 'Djanet', 'جانت', 5], ['57', "El M'Ghair", 'المغير', 4],
  ['58', 'El Meniaa', 'المنيعة', 4],
] as [string, string, string, number][]

export const WILAYAS: WilayaInfo[] = W.map(([code, name, nameAr, zone]) => ({
  code: parseInt(code, 10),
  name,
  nameAr,
  nameFr: name,
  zone,
  homeFee: ZONE_FEES[zone].home,
  deskFee: ZONE_FEES[zone].desk,
}))

export const CARRIERS = [
  {
    id: 'yalidine',
    name: 'Yalidine',
    nameAr: 'ياليدين',
    color: '#16a34a',
    prefix: 'YAL',
    coverage: '58 wilayas',
    avgDays: '1-3 days',
    desc: 'Leader in COD delivery across Algeria. Home & desk delivery.',
  },
  {
    id: 'zrexpress',
    name: 'ZR Express',
    nameAr: 'ZR إكسبريس',
    color: '#dc2626',
    prefix: 'ZR',
    coverage: '48 wilayas',
    avgDays: '2-4 days',
    desc: 'Fast nationwide delivery with strong regional coverage.',
  },
  {
    id: 'maystro',
    name: 'Maystro',
    nameAr: 'مايسترو',
    color: '#ea580c',
    prefix: 'MYS',
    coverage: '58 wilayas',
    avgDays: '2-4 days',
    desc: 'Reliable COD delivery with pickup points network.',
  },
  {
    id: 'noest',
    name: 'NOEST Express',
    nameAr: 'نويست إكسبريس',
    color: '#0f766e',
    prefix: 'NST',
    coverage: '48 wilayas',
    avgDays: '2-5 days',
    desc: 'Express parcel delivery with insurance options.',
  },
] as const

export function wilayaByCode(code: number): WilayaInfo | undefined {
  return WILAYAS.find((w) => w.code === code)
}
