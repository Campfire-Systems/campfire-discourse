import { withPluginApi } from "discourse/lib/plugin-api";

export default {
    name: "campfire-discourse",

    initialize(container) {
        withPluginApi("1.6.0", (api) => {
            try {
                const CAMPFIRE_OPTIONS_PREFIX = 'CampfireOptions:::';
                const OPTIONS_SEPERATOR = ':::';
                const CAMPFIRE_SELECTED_PREFIX = 'CampfireSelected:::';
                const EVENT_ENDPOINT = 'https://discourse-event-handler.campfire.so/click';

                function getPostId(post) {
                    while (post) {
                        if (post.tagName == 'ARTICLE')
                            return post.getAttribute('data-post-id')

                        post = post.parentNode;
                    }

                    return null;
                }

                function optionClickHandler(target, lastNodeExecutionId, optionValue) {
                    const currentUser = api.getCurrentUser();
                    const postId = getPostId(target);

                    const payload = {
                        user: {
                            id: currentUser.id,
                            username: currentUser.username
                        },
                        postId: postId,
                        lastNodeExecutionId: lastNodeExecutionId,
                        optionValue: optionValue
                    }

                    fetch(EVENT_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })
                }

                function addOption(postDiv, lastNodeExecutionId, optionText) {
                    const optionDiv = document.createElement("span");

                    optionDiv.innerHTML = optionText;
                    optionDiv.className = "campfire-option";

                    optionDiv.addEventListener('click', function(e) {
                        optionDiv.className = "campfire-selected-option";
                        optionClickHandler(e.target, lastNodeExecutionId, optionText);
                    });

                    postDiv.appendChild(optionDiv);
                }

                function addSelectedOption(postDiv, optionText) {
                    const optionDiv = document.createElement("span");

                    optionDiv.innerHTML = optionText;
                    optionDiv.className = "campfire-selected-option";

                    postDiv.appendChild(optionDiv);
                }

                api.decorateCookedElement(function(post) {
                    const postText = post.textContent;

                    // We have options
                    if (postText.startsWith(CAMPFIRE_OPTIONS_PREFIX)) {
                        const optionsString = postText.slice(CAMPFIRE_OPTIONS_PREFIX.length)
                        const options = optionsString.split(OPTIONS_SEPERATOR)
                        post.innerHTML = "";

                        // The first value in options is the last executed node id, the rest are options
                        const lastNodeExecutionId = options[0];
                        for (var i = 1; i < options.length; i++)
                            addOption(post, lastNodeExecutionId, options[i]);
                    }

                    // We have a selected option
                    if (postText.startsWith(CAMPFIRE_SELECTED_PREFIX)) {
                        const selectedOption = postText.slice(CAMPFIRE_SELECTED_PREFIX.length)

                        post.innerHTML = "";
                        addSelectedOption(post, selectedOption)
                    }
                }, {
                    id: "campfire-discourse"
                });
            } catch (error) {
                console.error("There's an issue in the Campfire theme component: ", error);
            }
        });
    },
};
