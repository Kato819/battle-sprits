// --- カードマスターデータ（図鑑データ） ---
const CARD_DATABASE = {
    "bs-01": {
        name: "Sagitt-Apollodragon",
        type: "spirit", // spirit, brave, nexus, magic 等
        cost: 8,
        image: "images/sagitt_apollodragon.png"
    },
    "bs-02": {
        name: "Blade-Ra",
        type: "spirit",
        cost: 0,
        image: "images/blade_ra.jpg"
    },
    "bs-03": {
        name: "Darkwurm-Nova",
        type: "spirit",
        cost: 8,
        image: "images/darkwurm_nova.jpg"
    },
    "bs-04": {
        name: "Veloci-Harper",
        type: "spirit",
        cost: 8,
        image: "images/veloci_harper.png"
    },
    "bs-05": {
        name: "The SunDragon Apollodragon",
        type: "spirit",
        cost: 8,
        image: "images/apollodragon.png"
    },
    "bs-06": {
        name: "The StarEmperorDragon Geminize",
        type: "spirit",
        cost: 8,
        image: "images/geminize.png"
    },
    "bs-07": {
        name: "Iguabaggy",
        type: "spirit",
        cost: 8,
        image: "images/iguabaggy.png"
    },
    "bs-08": {
        name: "Starry Draw",
        type: "spirit",
        cost: 8,
        image: "images/starry_draw.png"
    },
    "bs-09": {
        name: "The DragonBullEmperor Dragonic-Taurus",
        type: "spirit",
        cost: 8,
        image: "images/dragonic_taurus.png"
    },
    "bs-10": {
        name: "Morgasaurus",
        type: "spirit",
        cost: 8,
        image: "images/morgasaurus.png"
    },
    "bs-11": {
        name: "The SunDragonLord Rising-Apollodragon",
        type: "spirit",
        cost: 8,
        image: "images/rising_apollodragon.png"
    },
    "bs-12": {
        name: "Revive Draw",
        type: "spirit",
        cost: 8,
        image: "images/revive_draw.png"
    },
    "bs-13": {
        name: "Sagitta Flame",
        type: "spirit",
        cost: 8,
        image: "images/sagitta_flame.png"
    },
    "bs-14": {
        name: "magic_boost",
        type: "spirit",
        cost: 8,
        image: "images/magic_boost.png"
    },
    "bs-15": {
        name: "burning_sun",
        type: "spirit",
        cost: 8,
        image: "images/burning_sun.png"
    },
    "bs-16": {
        name: "shine_blazer",
        type: "spirit",
        cost: 8,
        image: "images/shine_blazer.png"
    },
    "bs-17": {
        name: "phoenix_cannon",
        type: "spirit",
        cost: 8,
        image: "images/phoenix_cannon.png"
    },
    "bs-18": {
        name: "delta_barrier",
        type: "spirit",
        cost: 8,
        image: "images/delta_barrier.png"
    },
    "bs-19": {
        name: "cross_frame",
        type: "spirit",
        cost: 8,
        image: "images/cross_frame.png"
    },
    "bs-20": {
        name: "tres_beluga",
        type: "spirit",
        cost: 8,
        image: "images/tres_beluga.png"
    },
    "bs-21": {
        name: "storm_draw",
        type: "spirit",
        cost: 8,
        image: "images/storm_draw.png"
    },
    "bs-22": {
        name: "ralba",
        type: "spirit",
        cost: 8,
        image: "images/ralba.png"
    },
    "bs-23": {
        name: "Northernbeard",
        type: "spirit",
        cost: 8,
        image: "images/Northernbeard.png"
    },
    "bs-24": {
        name: "Pendragon",
        type: "spirit",
        cost: 8,
        image: "images/Pendragon.png"
    },
    "bs-25": {
        name: "life_charge",
        type: "spirit",
        cost: 8,
        image: "images/life_charge.png"
    },
    "bs-26": {
        name: "Protect_Aura",
        type: "spirit",
        cost: 8,
        image: "images/Protect_Aura.png"
    },
    "bs-27": {
        name: "Cancerd",
        type: "spirit",
        cost: 8,
        image: "images/Cancerd.png"
    },
    "bs-28": {
        name: "Strike-Siegwurm",
        type: "spirit",
        cost: 8,
        image: "images/Strike-Siegwurm.png"
    },
    "bs-29": {
        name: "Scor-Spear",
        type: "spirit",
        cost: 8,
        image: "images/Scor-Spear.png"
    },
    "bs-30": {
        name: "Danderabbit",
        type: "spirit",
        cost: 8,
        image: "images/Danderabbit.png"
    },
    "bs-31": {
        name: "Dark_Sacred_Sword",
        type: "spirit",
        cost: 8,
        image: "images/Dark_Sacred_Sword.png"
    },
    "bs-32": {
        name: "Reboot_Code",
        type: "spirit",
        cost: 8,
        image: "images/Reboot_Code.png"
    },
    "bs-33": {
        name: "Aqua-Elysion",
        type: "spirit",
        cost: 8,
        image: "images/Aqua-Elysion.png"
    },
    "bs-34": {
        name: "Libra-Golem",
        type: "spirit",
        cost: 8,
        image: "images/Libra-Golem.png"
    },
    "bs-35": {
        name: "Swordoll",
        type: "spirit",
        cost: 8,
        image: "images/Swordoll.png"
    },
    "bs-36": {
        name: "Manekicat",
        type: "spirit",
        cost: 8,
        image: "images/Manekicat.png"
    },
    "bs-37": {
        name: "Light_Sacred_Sword",
        type: "spirit",
        cost: 8,
        image: "images/Light_Sacred_Sword.png"
    },
    "bs-38": {
        name: "Stein-Bolg",
        type: "spirit",
        cost: 8,
        image: "images/Stein-Bolg.png"
    },
    "bs-39": {
        name: "Lunatech-Strikewurm",
        type: "spirit",
        cost: 8,
        image: "images/Lunatech-Strikewurm.png"
    },
    "bs-40": {
        name: "Hawk-Breaker",
        type: "spirit",
        cost: 8,
        image: "images/Hawk-Breaker.png"
    },
    "bs-41": {
        name: "Asklepiooze",
        type: "spirit",
        cost: 8,
        image: "images/Asklepiooze.png"
    },
    "bs-42": {
        name: "Strikewurm-Leo",
        type: "spirit",
        cost: 8,
        image: "images/Strikewurm-Leo.png"
    }
};
