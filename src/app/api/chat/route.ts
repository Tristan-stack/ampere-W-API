// Route pour le chat non utilisé pour le moment


// import { GoogleGenerativeAI } from '@google/generative-ai'
// import { NextResponse } from 'next/server'

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// const SYSTEM_PROMPT = `Tu es un assistant intelligent spécialisé dans les sujets liés à l'énergie et à l'électricité et ton nom est Ampy. Tu as également accès aux données météorologiques en temps réel.

// Ton rôle est de répondre aux questions des utilisateurs de manière pédagogique, précise et utile. Les utilisateurs peuvent te poser des questions sur la production d'énergie, la consommation, les économies d'énergie, les sources renouvelables, ou tout autre sujet lié à l'électricité dans sa globalité.

// Tu es aussi chaleureux et amical. Si un utilisateur te pose une question personnelle ou générale, tu peux répondre brièvement de manière sympathique avant de rediriger la conversation vers ton domaine d'expertise.

// Règles importantes:
// - Répondre de manière amicale aux questions générales tout en redirigeant vers l'énergie
// - Utiliser les données de consommation/production fournies quand c'est pertinent
// - Rester chaleureux et professionnel
// - Utiliser des émojis avec modération
// - Répondre en français
// - Être concis et direct dans les réponses techniques

// Si une question est complètement hors sujet, rappelle poliment que tu es spécialisé dans l'énergie et l'électricité.

// Instructions pour l'analyse des données en temps réel:
// - Tu as accès aux données de consommation actuelles des bâtiments et des étages via le contexte fourni
// - Pour les questions sur un étage spécifique, utilise les données de context.buildings.floors
// - Format des étages: "Rez-de-chaussée", "1er étage", "2e étage", "3e étage"
// - Quand on te demande des informations sur la consommation actuelle, utilise les données du contexte
// - Présente les données de manière claire et concise
// - Convertis les unités si nécessaire pour plus de clarté
// - Compare les étages entre eux si pertinent
// - N'invente pas de données, utilise uniquement celles fournies

// Format des données disponibles:
// - aggregatedData: données historiques par bâtiment
// - currentConsumption: dernières mesures de consommation par bâtiment
// - selectedBuildings: bâtiments actuellement sélectionnés
// - floors: données détaillées par étage (format: "batiment-etage")
// - weatherData: données météorologiques incluant température, humidité, visibilité, couverture nuageuse et précipitations

// Tu peux utiliser les données météo pour:
// - Répondre aux questions sur la météo actuelle et passée
// - Faire le lien entre la météo et la consommation d'énergie
// - Donner des conseils adaptés aux conditions météorologiques

// Exemple de réponse pour une question sur un étage:
// "La consommation actuelle du 1er étage du bâtiment A est de X kWh, ce qui représente Y% de la consommation totale du bâtiment."`

// // Stocker les chats actifs
// const activeChats = new Map()

// export async function POST(req: Request) {
//     try {
//         const { message, context, chatId } = await req.json()

//         console.log('🤖 Contexte reçu par l\'API:', {
//             message,
//             buildingsData: {
//                 selectedBuildings: context.buildings.selectedBuildings,
//                 currentConsumption: context.buildings.currentConsumption
//             }
//         })

//         if (!process.env.GEMINI_API_KEY) {
//             console.error('Clé API Gemini manquante')
//             return NextResponse.json(
//                 { error: 'Configuration incorrecte du serveur' },
//                 { status: 500 }
//             )
//         }

//         // Vérification de la validité de la clé API
//         if (process.env.GEMINI_API_KEY.length < 10) {
//             console.error('Clé API Gemini invalide')
//             return NextResponse.json(
//                 { error: 'Configuration incorrecte du serveur' },
//                 { status: 500 }
//             )
//         }

//         let newChatId = chatId

//         try {
//             const model = genAI.getGenerativeModel({
//                 model: 'gemini-1.5-pro',
//                 generationConfig: {
//                     temperature: 0.7,
//                     topK: 1,
//                     topP: 0.8,
//                     maxOutputTokens: 2048,
//                 },
//             })

//             let chat
//             if (chatId && activeChats.has(chatId)) {
//                 chat = activeChats.get(chatId)
//                 try {
//                     const result = await chat.sendMessage(message)
//                     const response = await result.response.text()
//                     return NextResponse.json({ response, chatId })
//                 } catch (error: any) {
//                     console.error('Erreur Gemini (chat existant):', error.message)

//                     // Gestion spécifique de l'erreur de quota
//                     if (error.message?.includes('429') || error.message?.includes('quota')) {
//                         return NextResponse.json(
//                             {
//                                 error: 'Limite de requêtes atteinte',
//                                 details: 'Le service est temporairement indisponible. Veuillez réessayer plus tard.'
//                             },
//                             { status: 429 }
//                         )
//                     }

//                     throw error
//                 }
//             } else {
//                 chat = model.startChat({
//                     history: [
//                         {
//                             role: 'user',
//                             parts: [{ text: SYSTEM_PROMPT }],
//                         },
//                         {
//                             role: 'model',
//                             parts: [{ text: "Je suis prêt à t'aider avec tes questions sur l'énergie." }],
//                         },
//                     ],
//                     generationConfig: {
//                         maxOutputTokens: 2048,
//                     },
//                 })

//                 try {
//                     const prompt = `
//                     Contexte des données actuelles:
//                     Données bâtiments: ${JSON.stringify(context.buildings)}
//                     Données météo: ${JSON.stringify(context.weatherData)}
                    
//                     Question de l'utilisateur: ${message}
//                     `

//                     console.log('💭 Prompt envoyé à Gemini:', {
//                         question: message,
//                         contextDonnées: context.buildings.currentConsumption
//                     })

//                     const result = await chat.sendMessage(prompt)
//                     const response = await result.response.text()

//                     if (!chatId) {
//                         newChatId = Date.now().toString()
//                         activeChats.set(newChatId, chat)
//                     }

//                     return NextResponse.json({
//                         response,
//                         chatId: newChatId
//                     })
//                 } catch (error: any) {
//                     console.error('Erreur Gemini (nouveau chat):', error.message)
//                     throw error
//                 }
//             }
//         } catch (error: any) {
//             console.error('Erreur détaillée Gemini:', error)

//             // Gestion globale de l'erreur de quota
//             if (error.message?.includes('429') || error.message?.includes('quota')) {
//                 return NextResponse.json(
//                     {
//                         error: 'Limite de requêtes atteinte',
//                         details: 'Le service est temporairement indisponible. Veuillez réessayer plus tard.'
//                     },
//                     { status: 429 }
//                 )
//             }

//             return NextResponse.json(
//                 {
//                     error: 'Erreur lors de la communication avec l\'assistant',
//                     details: error.message
//                 },
//                 { status: 500 }
//             )
//         }
//     } catch (error: any) {
//         console.error('Erreur API Chat:', error)
//         return NextResponse.json(
//             {
//                 error: 'Erreur lors du traitement de la requête',
//                 details: error.message
//             },
//             { status: 500 }
//         )
//     }
// } 