/**
 * The Central Medical Repository.
 * Ported from Python "Physio Survey System - Advanced AI Engine (Tier 3 Medical Logic)"
 */

class KnowledgeBase {
    constructor() {
        // ----------------------------------------------------------------------
        // NERVE MAPS (The Wiring Diagram)
        // ----------------------------------------------------------------------
        this.dermatomes = {
            'C2': ['occipital_region', 'upper_neck'],
            'C3': ['neck_lateral', 'supraclavicular_fossa'],
            'C4': ['shoulder_upper', 'clavicle_region'],
            'C5': ['lateral_arm', 'deltoid_region', 'radial_forearm'], // Bicep area
            'C6': ['thumb', 'index_finger', 'radial_forearm', 'biceps_region'], // "Shooter" finger
            'C7': ['middle_finger', 'triceps_region', 'mid_palm'], // Middle finger
            'C8': ['ring_finger', 'little_finger', 'ulnar_forearm', 'ulnar_palm'], // Pinky side
            'T1': ['medial_forearm', 'medial_elbow', 'axilla_lower'],
            'T2': ['axilla', 'upper_chest', 'scapula_medial'],
            'T4': ['nipple_level', 'mid_chest'],
            'T10': ['umbilicus', 'mid_abdomen'],
            'L1': ['inguinal_region', 'groin', 'upper_thigh_medial'],
            'L2': ['thigh_anterior', 'thigh_medial_upper'],
            'L3': ['knee_medial', 'thigh_lower', 'thigh_anterior'],
            'L4': ['medial_foot', 'big_toe', 'medial_malleolus', 'knee_anterior'], // Arch/Big toe
            'L5': ['lateral_leg', 'dorsum_foot', 'toes_2_3_4', 'plantar_foot_upper'], // Top of foot
            'S1': ['lateral_foot', 'posterior_leg', 'little_toe', 'heel', 'plantar_foot'], // Pinky toe/Calf
            'S2': ['posterior_thigh', 'popliteal_fossa', 'posterior_leg_medial']
        };

        // ----------------------------------------------------------------------
        // PATHOLOGY FINGERPRINTS (The "Crime Profiles")
        // ----------------------------------------------------------------------
        this.pathologySignatures = {
            // --- CERVICAL SPINE & NECK ---
            'cervical_radiculopathy': { // "Pinched Nerve in Neck"
                'regions': ['neck', 'arm', 'hand', 'scapula'],
                'quality': ['shooting', 'electric', 'burning', 'numbness'],
                'aggravators': ['looking_up', 'turning_head', 'coughing', 'sneezing', 'spurlings_test'],
                'relievers': ['hand_on_head', 'rest', 'supine'],
                'risk_factors': ['age_gt_40', 'sedentary_job', 'smoking'],
                'probability_base': 0.1
            },
            'cervical_myelopathy': { // "Spinal Cord Compression" (DANGEROUS)
                'regions': ['neck', 'hands_bilateral', 'legs_bilateral'],
                'quality': ['numbness', 'clumsiness', 'weakness', 'gait_instability'],
                'aggravators': ['neck_flexion', 'walking'],
                'red_flag': true,
                'probability_base': 0.05
            },
            'upper_cross_syndrome': { // "Tech Neck / Slouching"
                'regions': ['neck_base', 'shoulders', 'upper_back', 'occiput'],
                'quality': ['aching', 'stiffness', 'tension', 'burning_ache'],
                'aggravators': ['desk_work', 'driving', 'stress', 'screen_time'],
                'associated_signs': ['forward_head', 'rounded_shoulders'],
                'probability_base': 0.3
            },
            'cervicogenic_headache': {
                'regions': ['occiput', 'behind_eye', 'temple', 'neck_upper'],
                'quality': ['dull', 'aching', 'pressure'],
                'aggravators': ['sustained_posture', 'neck_movement', 'stress'],
                'relievers': ['rest', 'massage', 'heat'],
                'probability_base': 0.15
            },
            'whiplash_associated_disorder': {
                'regions': ['neck', 'upper_back', 'shoulders'],
                'quality': ['stiffness', 'pain', 'dizziness'],
                'aggravators': ['movement', 'static_posture'],
                'history_flag': 'trauma_mva',
                'probability_base': 0.1
            },
            'torticollis': {
                'regions': ['neck'],
                'quality': ['spasm', 'sharp_on_movement', 'locked'],
                'aggravators': ['movement'],
                'relievers': ['rest'],
                'probability_base': 0.05
            },

            // --- SHOULDER ---
            'rotator_cuff_tendinopathy': {
                'regions': ['shoulder_lateral', 'upper_arm', 'deltoid_insertion'],
                'quality': ['sharp_catches', 'dull_ache', 'weakness'],
                'aggravators': ['overhead_reaching', 'sleeping_on_side', 'reaching_back'],
                'probability_base': 0.25
            },
            'adhesive_capsulitis': { // "Frozen Shoulder"
                'regions': ['shoulder', 'upper_arm'],
                'quality': ['stiffness', 'aching', 'restricted_movement'],
                'aggravators': ['external_rotation', 'abduction', 'night_pain'],
                'risk_factors': ['diabetes', 'thyroid_issue', 'female_40_60'],
                'probability_base': 0.1
            },
            'subacromial_impingement': {
                'regions': ['shoulder_anterolateral'],
                'quality': ['pinching', 'sharp_arc'],
                'aggravators': ['overhead_activities', 'internal_rotation'],
                'probability_base': 0.2
            },
            'labral_tear_slap': {
                'regions': ['shoulder_deep'],
                'quality': ['clicking', 'popping', 'deep_ache'],
                'aggravators': ['throwing', 'overhead_pressure'],
                'probability_base': 0.05
            },

            // --- ELBOW & WRIST ---
            'lateral_epicondylalgia': { // "Tennis Elbow"
                'regions': ['elbow_lateral', 'forearm_extensors'],
                'quality': ['burning', 'aching'],
                'aggravators': ['gripping', 'typing', 'lifting_palm_down'],
                'probability_base': 0.15
            },
            'medial_epicondylalgia': { // "Golfer's Elbow"
                'regions': ['elbow_medial', 'forearm_flexors'],
                'quality': ['aching', 'sharp_with_grip'],
                'aggravators': ['gripping', 'lifting_palm_up'],
                'probability_base': 0.05
            },
            'carpal_tunnel_syndrome': {
                'regions': ['wrist', 'thumb', 'index_finger', 'middle_finger'],
                'quality': ['numbness', 'tingling', 'night_pain'],
                'aggravators': ['typing', 'driving', 'sleeping'],
                'relievers': ['shaking_hands'],
                'probability_base': 0.15
            },
            'de_quervains_tenosynovitis': {
                'regions': ['thumb_base', 'wrist_radial'],
                'quality': ['sharp', 'aching'],
                'aggravators': ['thumb_movement', 'gripping', 'texting'],
                'probability_base': 0.1
            },

            // --- THORACIC & CHEST ---
            'thoracic_outlet_syndrome': {
                'regions': ['neck', 'shoulder', 'arm', 'hand'],
                'quality': ['heaviness', 'tingling', 'coldness'],
                'aggravators': ['overhead_posture', 'carrying_heavy'],
                'probability_base': 0.05
            },
            'costochondritis': {
                'regions': ['sternum', 'ribs_anterior'],
                'quality': ['sharp', 'stabbing'],
                'aggravators': ['deep_breath', 'coughing', 'movement'],
                'probability_base': 0.05
            },
            'thoracic_facet_syndrome': {
                'regions': ['mid_back', 'scapula_medial'],
                'quality': ['sharp', 'locked'],
                'aggravators': ['rotation', 'extension', 'deep_breath'],
                'probability_base': 0.1
            },

            // --- LUMBAR SPINE & PELVIS ---
            'lumbar_disc_herniation': {
                'regions': ['low_back', 'buttock', 'leg', 'foot', 'calves'],
                'quality': ['shooting', 'sharp', 'electric', 'burning'],
                'aggravators': ['sitting', 'bending_forward', 'coughing', 'morning', 'driving'],
                'relievers': ['walking', 'lying_prone', 'standing'],
                'probability_base': 0.2
            },
            'lumbar_stenosis': {
                'regions': ['low_back', 'legs_bilateral', 'thighs'],
                'quality': ['heaviness', 'cramping', 'numbness', 'weakness'],
                'aggravators': ['walking_distance', 'standing', 'bending_backward'],
                'relievers': ['sitting', 'bending_forward', 'leaning_shopping_cart'],
                'risk_factors': ['age_gt_60'],
                'probability_base': 0.15
            },
            'mechanical_low_back_pain': {
                'regions': ['low_back', 'buttock'],
                'quality': ['dull', 'aching', 'throbbing', 'stiffness'],
                'aggravators': ['prolonged_posture', 'heavy_lifting', 'fatigue'],
                'relievers': ['movement', 'heat', 'rest', 'changing_positions'],
                'probability_base': 0.4
            },
            'spondylolisthesis': {
                'regions': ['low_back'],
                'quality': ['aching', 'instability_feeling'],
                'aggravators': ['extension', 'standing_long_time'],
                'risk_factors': ['adolescent_athlete', 'gymnastics', 'football'],
                'probability_base': 0.05
            },
            'sacroiliac_joint_dysfunction': {
                'regions': ['glute_medial', 'low_back', 'groin'],
                'quality': ['sharp', 'aching'],
                'aggravators': ['single_leg_stance', 'stairs', 'turning_in_bed'],
                'probability_base': 0.1
            },
            'coccygodynia': {
                'regions': ['tailbone'],
                'quality': ['sharp', 'tenderness'],
                'aggravators': ['sitting_hard_surface', 'sit_to_stand'],
                'probability_base': 0.02
            },

            // --- HIP & GROIN ---
            'hip_osteoarthritis': {
                'regions': ['groin', 'thigh_anterior', 'hip_lateral'],
                'quality': ['stiffness_morning', 'ache'],
                'aggravators': ['weight_bearing', 'internal_rotation', 'tie_shoes'],
                'risk_factors': ['age_gt_50'],
                'probability_base': 0.15
            },
            'femoroacetabular_impingement': {
                'regions': ['groin', 'hip_deep'],
                'quality': ['pinching', 'sharp'],
                'aggravators': ['squatting', 'sitting_low'],
                'probability_base': 0.1
            },
            'greater_trochanteric_pain_syndrome': {
                'regions': ['hip_lateral', 'thigh_lateral'],
                'quality': ['aching', 'burning'],
                'aggravators': ['lying_on_side', 'walking', 'stairs'],
                'probability_base': 0.15
            },
            'piriformis_syndrome': {
                'regions': ['buttock', 'posterior_thigh'],
                'quality': ['aching', 'tingling'],
                'aggravators': ['sitting', 'wallet_in_pocket'],
                'probability_base': 0.1
            },

            // --- KNEE ---
            'patellofemoral_pain_syndrome': {
                'regions': ['knee_anterior', 'kneecap'],
                'quality': ['aching', 'grinding'],
                'aggravators': ['stairs_down', 'squatting', 'sitting_prolonged'],
                'probability_base': 0.2
            },
            'knee_osteoarthritis': {
                'regions': ['knee_medial', 'knee_diffuse'],
                'quality': ['stiffness', 'aching', 'crepitus'],
                'aggravators': ['walking', 'weather_change', 'morning'],
                'risk_factors': ['age_gt_50', 'obesity'],
                'probability_base': 0.2
            },
            'meniscal_tear': {
                'regions': ['knee_joint_line'],
                'quality': ['sharp', 'locking', 'giving_way'],
                'aggravators': ['twisting', 'squatting'],
                'probability_base': 0.1
            },
            'iliotibial_band_syndrome': {
                'regions': ['knee_lateral', 'thigh_lateral'],
                'quality': ['sharp', 'burning'],
                'aggravators': ['running', 'cycling'],
                'probability_base': 0.1
            },
            'patellar_tendinopathy': {
                'regions': ['knee_inferior_pole'],
                'quality': ['sharp', 'aching'],
                'aggravators': ['jumping', 'stairs', 'squatting'],
                'probability_base': 0.05
            },

            // --- ANKLE & FOOT ---
            'plantar_fasciitis': {
                'regions': ['heel', 'arch', 'sole'],
                'quality': ['sharp_first_step', 'throbbing', 'stiffness'],
                'aggravators': ['morning', 'standing_long_duration', 'barefoot'],
                'probability_base': 0.2
            },
            'achilles_tendinopathy': {
                'regions': ['heel_posterior', 'calf_lower'],
                'quality': ['stiffness_morning', 'sharp', 'thickening'],
                'aggravators': ['running', 'uphill'],
                'probability_base': 0.1
            },
            'inversion_sprain': {
                'regions': ['ankle_lateral'],
                'quality': ['swelling', 'throbbing', 'sharp'],
                'aggravators': ['weight_bearing', 'inversion'],
                'history_flag': 'trauma_roll',
                'probability_base': 0.1
            },
            'mortons_neuroma': {
                'regions': ['toes_3_4', 'ball_of_foot'],
                'quality': ['burning', 'pebble_in_shoe', 'electric'],
                'aggravators': ['tight_shoes'],
                'probability_base': 0.05
            }
        };

        // ----------------------------------------------------------------------
        // RED FLAGS (Do Not Treat - Refer Out)
        // ----------------------------------------------------------------------
        this.redFlagCriteria = {
            'cauda_equina': ['saddle_anesthesia', 'bladder_retention', 'bowel_incontinence', 'bilateral_leg_weakness'],
            'fracture': ['trauma_history', 'osteoporosis', 'age_gt_70', 'steroid_use'],
            'malignancy': ['night_pain_unrelenting', 'unexplained_weight_loss', 'history_cancer', 'systemic_illness', 'night_sweats'],
            'infection': ['fever', 'chills', 'iv_drug_use', 'recent_surgery', 'redness_streaking'],
            'myocardial_infarction': ['chest_pressure', 'jaw_pain', 'left_arm_numbness', 'shortness_of_breath'],
            'dvt': ['calf_swelling', 'calf_redness', 'recent_flight', 'calf_warmth']
        };
    }

    getDermatome(location) {
        for (const [level, areas] of Object.entries(this.dermatomes)) {
            if (areas.some(area => location.includes(area) || area.includes(location))) {
                return level;
            }
        }
        return null;
    }
}

module.exports = KnowledgeBase;
