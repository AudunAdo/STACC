const exposeMessage = document.getElementById("expose-message");
const search = document.getElementById("search")
const group = document.getElementById("search-group");

const messages = {
    exposedPerson: {
        title: "⨯ Political exposure detected",
        description:"This client is politically exposed according to opensanctions.org. Offering a loan to them will require manual authorization. Contact your supervisor for further information.",
        isExposed: true
    },
    exposedOrganization: {
        title: "⨯ Political exposure detected",
        description:"This company has politically exposed members according to Brønnøysundregisteret and opensanctions.org. Offering a loan to them will require manual authorization. Contact your supervisor for further information.",
        isExposed:true
    },
    notExposedPerson: {
        title: "✓ No exposure detected",
        description:"This client is not politically exposed.",
        isExposed:false
    },
    notExposedOrganization: {
        title: "✓ Political exposure detected",
        description:"This organization is not politically exposed.",
        isExposed:false
    }
}

search.onchange = async function() {

    setExposeMessage(undefined)

    if (!search.value.trim()) {
        return;
    }

    if (group.value === "person") {

        const isExposed = await isPersonPoliticallyExposed(search.value);
        const message = isExposed ? messages.exposedPerson : messages.notExposedPerson;
        setExposeMessage(message);
    }
    else if (group.value === "organization") {
        const isExposed = await isOrganizationPoliticallyExposed(search.value);
        const message = isExposed ? messages.exposedOrganization : messages.notExposedOrganization;
        setExposeMessage(message);
    }
    else {
        alert("Group is not supported: " + group.value);
        setExposeMessage(undefined);
    }
}

/**
 * 
 * @param {ExposeMessage|undefined} message 
 */
function setExposeMessage(message = undefined) {
    if (!message) {
        exposeMessage.classList.add("hidden")
    } else {
        exposeMessage.classList.remove("hidden")
        exposeMessage.querySelector("h2").innerText = message.title;
        exposeMessage.querySelector("blockquote").innerText = message.description;
        exposeMessage.classList.toggle("warn", message.isExposed);
    }
}

/**
 * Returns if a person is politically exposed.
 * @param {string} name Name of person.
 * @return {Promise<boolean>}
 */
async function isPersonPoliticallyExposed(name) {
    // Request data from API
    const response = await fetch("https://code-challenge.stacc.dev/api/pep?name="+name)

    // Convert response to JSON format
    const result = await response.json()

    // If the name is not registered, the person is not politically exposed.
    return result.numberOfHits !== 0
}

/**
 * Returns if an organization is politically exposed.
 * @param {string} organizationNumber Organization number.
 * @return {Promise<boolean>}
 */
async function isOrganizationPoliticallyExposed(organizationNumber) {
    // Iterate each name in organization
    for (const person of await getNamesFromOrganization(organizationNumber))
        // Check if person is politically exposed.
        if (await isPersonPoliticallyExposed(person))
            // if any person is exposed, the organization is exposed.
            return true;
    // If none are exposed, the organization is not exposed.
    return false;
}

/**
 * Gets the names of all names exposed in the organization.
 * @param {number} organizationNumber Organization number of organization to check.
 * @returns {Promise<string[]>} Names of members.
 */
 async function getNamesFromOrganization(organizationNumber) {
    // Request data from API
    const response = await fetch("https://code-challenge.stacc.dev/api/roller?orgNr="+organizationNumber)

    // Convert response to JSON format
    const results = await response.json()
    
    // Store names in array
    const names = new Set()

    for (const result of results)
    {
        for (const role of result.roller)
        {
            // If role is undefined or does not describe a person, skip it
            if (!role || !role.person) continue
            
            // Get full name of person
            const name = role.person.navn.fornavn + " " + role.person.navn.etternavn

            // Add name to name-list
            names.add(name)
        }
    }

    return [...names]
}