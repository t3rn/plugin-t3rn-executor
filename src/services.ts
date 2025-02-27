import {
    APODResponse,
    MarsRoverDataResponse
} from "./types";

const BASE_URL = "https://api.nasa.gov/planetary/apod\?api_key\=";

export const createNASAService = (apiKey: string) => {
    const getAPOD = async (): Promise<APODResponse> => {
        if (!apiKey) {
            throw new Error("Invalid parameters");
        }

        try {
            const url = BASE_URL + apiKey
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.message || response.statusText);
            }

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error("NASA API Error:", error.message);
            throw error;
        }
    };

    const getMarsRoverPhoto = async (): Promise<MarsRoverDataResponse> => {
        try {
            const data = await fetchMarsPhotos(apiKey)
            return data
        } catch (error: any) {
            console.error("NASA Mars Rover API Error:", error.message);
            throw error;
        }
    }

    return { getAPOD, getMarsRoverPhoto };
};

async function fetchMarsPhotos(apiKey, attempts = 0, maxAttempts = 10) {
    try {
        const curiosityCameras = [
            'FHAZ',
            'RHAZ',
            'MAST',
            'CHEMCAM',
            'MAHLI',
            'MARDI',
            'NAVCAM'
        ]
        const opportunityCameras = [
            'FHAZ',
            'RHAZ',
            'PANCAM',
            'MINITES'
        ]

        const CURIOUSITY_MAX_SOL = 3400
        const OPPORTUNITY_MAX_SOL = 4500

        const rovers = {
          curiosity: {
            cameras: curiosityCameras,
            maxSol: CURIOUSITY_MAX_SOL
          },
        //   opportunity: {
        //     cameras: opportunityCameras,
        //     maxSol: OPPORTUNITY_MAX_SOL
        //   },
        }

         // Select a random rover
         const roverNames = Object.keys(rovers);
         const randomRover = roverNames[Math.floor(Math.random() * roverNames.length)];
         const selectedRover = rovers[randomRover as keyof typeof rovers];

         // Get random camera for selected rover
         const randomCamera = selectedRover.cameras[Math.floor(Math.random() * selectedRover.cameras.length)];

         // Get random sol (Martian day) within rover's max
         const randomSol = Math.floor(Math.random() * selectedRover.maxSol) + 1;

         const requestURL = `https://api.nasa.gov/mars-photos/api/v1/rovers/${randomRover}/photos?sol=${randomSol}&camera=${randomCamera}&api_key=${apiKey}`
         console.log('requestURL::::::: ', requestURL)
         const response = await fetch(requestURL);
         const data = await response.json();

         if (data.photos.length) {
            const returnObj = {
                photo: data.photos[0].img_src,
                sol: randomSol,
                camera: randomCamera,
                rover: randomRover
            }
            return returnObj
        } else if (attempts < maxAttempts) {
            return fetchMarsPhotos(apiKey, attempts + 1, maxAttempts)
        } else {
            throw new Error('No photos found after maximum attempts')
        }
    } catch (err) {
        console.log("error fetch mar rover photos ...", err)
    }
}