### Few commands

## Forward prometheous port

# For Prometheus
kubectl port-forward svc/prometheus 9090:9090

# For Pushgateway
kubectl port-forward svc/pushgateway 9091:9091


# get deployments
kubectl get deployments


# restart deployment
kubectl rollout restart deployment <deployment-name>
