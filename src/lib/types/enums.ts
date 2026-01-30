export const Rite = {
	CW: 'CW',
	BCP: 'BCP'
} as const;
export type Rite = (typeof Rite)[keyof typeof Rite];

export const ServiceType = {
	CHORAL_EVENSONG: 'choral_evensong',
	COMPLINE: 'compline',
	SUNG_EUCHARIST: 'sung_eucharist',
	SAID_EUCHARIST: 'said_eucharist',
	CHORAL_MATINS: 'choral_matins',
	MORNING_PRAYER: 'morning_prayer',
	EVENING_PRAYER: 'evening_prayer',
	GAUDY_EVENSONG: 'gaudy_evensong',
	FEAST_DAY: 'feast_day',
	FUNERAL: 'funeral',
	MEMORIAL: 'memorial',
	OTHER: 'other'
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const ServiceTypeLabels: Record<ServiceType, string> = {
	choral_evensong: 'Choral Evensong',
	compline: 'Compline',
	sung_eucharist: 'Sung Eucharist',
	said_eucharist: 'Said Eucharist',
	choral_matins: 'Choral Matins',
	morning_prayer: 'Morning Prayer',
	evening_prayer: 'Evening Prayer',
	gaudy_evensong: 'Gaudy Evensong',
	feast_day: 'Feast Day',
	funeral: 'Funeral',
	memorial: 'Memorial',
	other: 'Other'
};

export const InvitationStatus = {
	POSSIBILITY: 'possibility',
	REQUESTED: 'requested',
	DECLINED: 'declined',
	ACCEPTED: 'accepted'
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const InvitationStatusLabels: Record<InvitationStatus, string> = {
	possibility: 'Possibility',
	requested: 'Requested',
	declined: 'Declined',
	accepted: 'Accepted'
};

export const Role = {
	PREACHER: 'preacher',
	OFFICIANT: 'officiant',
	CELEBRANT: 'celebrant',
	READER: 'reader',
	INTERCESSOR: 'intercessor',
	SERVER: 'server',
	ORGANIST: 'organist',
	CHOIR_DIRECTOR: 'choir_director',
	BISHOP: 'bishop',
	DEACON: 'deacon',
	OTHER: 'other'
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RoleLabels: Record<Role, string> = {
	preacher: 'Preacher',
	officiant: 'Officiant',
	celebrant: 'Celebrant',
	reader: 'Reader',
	intercessor: 'Intercessor',
	server: 'Server',
	organist: 'Organist',
	choir_director: 'Choir Director',
	bishop: 'Bishop',
	deacon: 'Deacon',
	other: 'Other'
};

export const BookingStatus = {
	NOT_NEEDED: 'not_needed',
	PENDING: 'pending',
	REQUESTED: 'requested',
	CONFIRMED: 'confirmed',
	CANCELLED: 'cancelled'
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const Visibility = {
	COLLEGE: 'college',
	PRIVATE: 'private'
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const LectionaryTradition = {
	CW: 'cw',
	BCP: 'bcp'
} as const;
export type LectionaryTradition = (typeof LectionaryTradition)[keyof typeof LectionaryTradition];

export const ReadingType = {
	OLD_TESTAMENT: 'old_testament',
	PSALM: 'psalm',
	EPISTLE: 'epistle',
	GOSPEL: 'gospel',
	CANTICLE: 'canticle',
	SECOND_READING: 'second_reading'
} as const;
export type ReadingType = (typeof ReadingType)[keyof typeof ReadingType];

export const ReadingTypeLabels: Record<ReadingType, string> = {
	old_testament: 'Old Testament',
	psalm: 'Psalm',
	epistle: 'Epistle',
	gospel: 'Gospel',
	canticle: 'Canticle',
	second_reading: 'Second Reading'
};

export const LiturgicalSeason = {
	ADVENT: 'advent',
	CHRISTMAS: 'christmas',
	EPIPHANY: 'epiphany',
	LENT: 'lent',
	HOLY_WEEK: 'holy_week',
	EASTER: 'easter',
	ASCENSION: 'ascension',
	PENTECOST: 'pentecost',
	TRINITY: 'trinity',
	ORDINARY_TIME: 'ordinary_time',
	KINGDOM: 'kingdom'
} as const;
export type LiturgicalSeason = (typeof LiturgicalSeason)[keyof typeof LiturgicalSeason];

export const LiturgicalColour = {
	WHITE: 'white',
	GOLD: 'gold',
	RED: 'red',
	GREEN: 'green',
	PURPLE: 'purple',
	BLUE: 'blue',
	ROSE: 'rose',
	BLACK: 'black',
	UNBLEACHED_LINEN: 'unbleached_linen'
} as const;
export type LiturgicalColour = (typeof LiturgicalColour)[keyof typeof LiturgicalColour];

export const ServiceContext = {
	PRINCIPAL: 'principal',
	MORNING_PRAYER: 'morning_prayer',
	EVENING_PRAYER: 'evening_prayer',
	SECOND_SERVICE: 'second_service',
	THIRD_SERVICE: 'third_service',
	DAILY_EUCHARIST: 'daily_eucharist'
} as const;
export type ServiceContext = (typeof ServiceContext)[keyof typeof ServiceContext];

export const ServiceContextLabels: Record<ServiceContext, string> = {
	principal: 'Principal Service',
	morning_prayer: 'Morning Prayer',
	evening_prayer: 'Evening Prayer',
	second_service: 'Second Service',
	third_service: 'Third Service',
	daily_eucharist: 'Daily Eucharist'
};

export const MusicType = {
	HYMN: 'hymn',
	ANTHEM: 'anthem',
	PSALM_SETTING: 'psalm_setting',
	CANTICLE: 'canticle',
	MASS_SETTING: 'mass_setting',
	INTROIT: 'introit',
	VOLUNTARY: 'voluntary',
	OTHER: 'other'
} as const;
export type MusicType = (typeof MusicType)[keyof typeof MusicType];

export const MusicPosition = {
	PROCESSIONAL: 'processional',
	GRADUAL: 'gradual',
	OFFERTORY: 'offertory',
	COMMUNION: 'communion',
	RECESSIONAL: 'recessional',
	ANTHEM: 'anthem',
	INTROIT: 'introit',
	PRE_SERVICE: 'pre_service',
	POST_SERVICE: 'post_service',
	OTHER: 'other'
} as const;
export type MusicPosition = (typeof MusicPosition)[keyof typeof MusicPosition];
